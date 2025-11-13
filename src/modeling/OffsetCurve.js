import { Parametric } from './Parametric.js';
import { Arc } from './Arc.js';
import { NurbsCurve } from './NurbsCurve.js';
import { knotMults, intersect3DLines, calcGreville, deWeight } from './NurbsLib.js';
import { selfSplitCurve, intersectCurves, splitCurves } from './bvh.js';
import { joinCurves } from './NurbsOper.js';

const TOL_APPR = 0.01;

/**
 * An approximated curve will be returned by getNurbsApproximated(), since an offset curve(O = C + dN)
 * invloves the square root term in the denominator of the unit normal vector. Even if the progenitor
 * curve is polynomial, its offset is not generally a polynomial or rational except for straight lines
 * and circles. This fundamental deficiency motivated a number of researchers who have developed various
 * approximation algorithm in terms of piecewise polynomial or rational polynomial functions.
 **/
class OffsetCurve extends Parametric {

	constructor( curve, signed_offset_distance, unit_z ) {

		super();
		this.c = curve; //progenitor curve
		this.signed_offset_distance = signed_offset_distance;
		this.z = unit_z;
		this.knots = curve.knots ? curve.knots : undefined;

	}

	get ctrlPoints() {

		return this.c.ctrlPoints;

	}

	get designPoints() {

		return this.c.designPoints;

	}

	getPointAt( t ) {

		const point = this.c.getPointAt( t );
		const normal = this.getNormalAt( t );
		return point.add( normal.mul( this.signed_offset_distance ) );

	}

	getDerivatives( t, k ) { // numerically evaluated

		const c = this.c;
		const dt = c.knots ? 1e-7 * ( c.tmax - c.tmin ) : 1e-7;
		const yp = this.getPointAt( t + dt );
		const yc = this.getPointAt( t );
		const ym = this.getPointAt( t - dt );

		const ds = yp.sub( ym );
		const dsdt = ds.mul( 0.5 / dt );

		const d2s = yp.sub( yc.mul( 2.0 ) ).add( ym );
		const d2sdt2 = d2s.mul( 1.0 / dt / dt );

		switch ( k ) {

			case 0:
				return [ yc ];

			case 1:
				return [ yc, dsdt ];

			case 2:
				return [ yc, dsdt, d2sdt2 ];

			default:
				console.warn( 'not implemented for derivatives higher than 2' );
				return;

		}

	}

	getNormalAt( t ) {

		const ders = this.c.getDerivatives( t, 1 );
		const tangent = ders[ 1 ].normalize();
		return this.z.cross( tangent ).normalize();

	}

	getDeviationAt( curve, t ) {

		// deviation at same parametric position
		const sub = this.c.getPointAt( t ).sub( curve.getPointAt( t ) );
		return Math.abs( sub.length() ** 2 - this.signed_offset_distance ** 2 ); //squareed distance

	}

	isCusp( t ) { // check if offset distance exceeds the radius of curvature of its progenitor curve in the concave region.

		const signed_offset_distance = this.signed_offset_distance;
		const intr = this.c.interrogationAt( t );
		const isOffsetBig = Math.abs( signed_offset_distance ) > intr.radiusOfCurvature;
		const isConcave = 0 < intr.normal.dot( this.getNormalAt( t ).mul( signed_offset_distance ) ); // intre.normal is concave direction
		const tangentProgen = intr.tangent;
		const tangentOffset = this.getDerivatives( t, 1 )[ 1 ];
		const isFlipped = 0 > tangentProgen.dot( tangentOffset ); // tangent flipped at cusps
		console.log( 'is offset big?', isOffsetBig, 'is concave?', isConcave, 'is flipped?', isFlipped );
		return isOffsetBig && isConcave || isFlipped;

	}

	getNurbsApproximated( obj3d ) {

		const knotmults = knotMults( this.c.knots );
		const c = this.c.clone();
		const signed_offset_distance = this.signed_offset_distance;
		const curves = [];

		let curve = new NurbsCurve( c.deg, c.knots.slice(), c.ctrlPoints.slice(), c.weights );

		for ( let i = 1; i < knotmults.length - 1; i ++ ) { // loop over interior knots

			const knot = knotmults[ i ].knot;
			const mult = knotmults[ i ].mult;

			if ( mult == curve.deg ) { // split at knuckle(degree-times knot multiplicities)

				const [ c0, c1 ] = curve.split( knot );
				curves.push( this.getNurbsLocalApprox( c0 ) );
				curve = c1;

			}

		} // end of for loop

		curves.push( this.getNurbsLocalApprox( curve ) );
		let c0 = curves[ 0 ];

		for ( let i = 1; i < curves.length; i ++ ) { // loop over curves

			const c1 = curves[ i ];
			const [ origin, tangentProgen ] = this.c.getDerivatives( c1.tmin, 1 );
			const p0 = c0.getPointAt( c0.tmax );
			const p1 = c1.getPointAt( c1.tmin );
			const tangentOffset = p1.sub( p0 );
			const isFlipped = tangentProgen.dot( tangentOffset ) < 0;

			if ( isFlipped ) { // concave region

				const [ crv0, crv1 ] = this.intersectOffset( c0, c1 );

				if ( crv0.length * crv1.length == 1 ) { // intersection with higher resolution needed, or discontinuous case (compared with offset distance, c0 and(or) c1 are so tiny)

					console.log( '%c no intersection in concave folding', 'color: #ff7597; font-weight: bold; background-color: #242424' );

				} else { // remove tangent-flipped parts

					crv0.length > 1 ? crv0.pop() : null;
					crv1.length > 1 ? crv1.shift() : null;

				}

				c0 = crv1[ crv1.length - 1 ];
				curves.splice( i - 1, 2, ...crv0, ...crv1 );
				i += crv0.length + crv1.length - 2;

			} else { // convex region

				c0 = c1;

				const l0 = origin.sub( p0 );
				const l1 = origin.sub( p1 );
				const theta = Math.acos( l0.normalize().dot( l1.normalize() ) );

				if ( theta > 1e-3 ) { // arc added

					const [ knots, ctrlpw ] = Arc.getArc( origin, p0, p1 );
					const arc = new NurbsCurve( 2, knots, deWeight( ctrlpw ), ctrlpw.map( e => e.w ) );
					curves.splice( i, 0, arc );
					i ++;

				}

			}

		} // end of for loop

		const res = [];
		c0 = curves.shift();

		while ( curves.length > 0 ) { // examine discontinuous parts

			const c1 = curves.shift();
			const p0 = c0.getPointAt( c0.tmax );
			const p1 = c1.getPointAt( c1.tmin );
			const dp = p1.sub( p0 );
			const isContinuous = dp.length() < 1e-9;
			console.log( 'distance=', dp.length(), 'is continuous?', isContinuous );

			if ( isContinuous ) {

				res.push( c0 );
				c0 = c1;

			} else { // case of discontinuous part

				const [ crv0, crv1 ] = splitCurves( c0, c1, 10, obj3d ); // try to split

				if ( crv0.length * crv1.length == 1 ) { // no intersection case, ignore shorter one

					const l0 = getChordlength( c0.designPoints );
					const l1 = getChordlength( c1.designPoints );

					if ( l0 > l1 ) {

						if ( l1 < Math.abs( signed_offset_distance ) ) { // c0 maintained, c1 ignored, examine next one

							console.log( 'ignore tiny length =', l1, c1 );

						} else { // do nothing (otherwise intersection with higher resolution may be needed)

							res.push( c0 );
							c0 = c1;

						}

					} else {

						if ( l0 < Math.abs( signed_offset_distance ) ) { // c0 ignored, c1 maintained, examine previous one

							console.log( 'ignore tiny length =', l0, c0 );

							if ( res.length > 1 ) { // do if previous one left in res

								curves.push( c1 );
								c0 = res.pop();

							} else { // otherwise, just ignore tiny c0

								c0 = c1;

							}

						} else { // do nothing (otherwise intersection with higher resolution may be needed)

							res.push( c0 );
							c0 = c1;

						}

					}

				} else { // remove tangent-flipped parts

					crv0.length > 1 ? crv0.pop() : null;
					crv1.length > 1 ? crv1.shift() : null;
					c0 = crv1.pop();
					res.push( ...crv0, ...crv1 );

				}

			}

		} // end of while loop, no element left in curves

		res.push( c0 );

		while ( res.length > 1 ) { // loop over all curves (including arcs)

			c0 = res.shift();

			res.map( c1 => { // intesection with other curves

				const [ crv0, crv1 ] = this.intersectOffset( c0, c1, obj3d );

				if ( crv0.length * crv1.length > 1 ) {

					c0 = crv0.shift();
					const index = res.indexOf( c1 );
					res.splice( index, 1 );
					res.push( ...crv0, ...crv1 );

				}

			} );

			curves.push( c0 );

		} // end of while loop, one element left in res

		curves.push( res.shift() );

		curves.slice().map( curve => { // check self intersection and unnecessary part

			const index = curves.indexOf( curve );
			const arr = curve.deg > 2 ? selfSplitCurve( curve ) : [ curve ]; // except of line, arc

			arr.slice().map( c => {

				const j = arr.indexOf( c );
				const t = 0.5 * ( c.tmin + c.tmax );

				if ( this.isCusp( t ) ) {

					arr.splice( j, 1 );

				} else {

					const p = c.getPointAt( t );
					const o = this.c.closestPoint( p );

					if ( o.sub( p ).length() < Math.abs( 0.99 * signed_offset_distance ) ) {

						arr.splice( j, 1 );

					}

				}

			} );

			curves.splice( index, 1, ...arr );

		} );

		// return curves;
		return joinCurves( curves );

	}

	getNurbsLocalApprox( curve ) {

		let c = curve.clone();

		const imax = 10;
		let i = 0;
		let sum;

		while ( i < imax ) {

			const ctrlp = c.ctrlPoints;
			const newCtrlPoints = this.OffsetControlPolygon( ctrlp );
			const OffsetCurve = new NurbsCurve( c.deg, c.knots.slice(), newCtrlPoints, c.weights );

			const prm = calcGreville( OffsetCurve.deg, OffsetCurve.knots );
			const n = prm.length;
			sum = 0;

			for ( let i = 0; i < n; i ++ ) {

				const localTol = 2 * TOL_APPR;
				const t = prm[ i ];
				const d = this.getDeviationAt( OffsetCurve, t );
				sum += d;

				if ( localTol < d ) {

					c.insertKnotAt( t );

				}

			}

			const error = sum / n;
			console.log( 'approximation error =', error );
			if ( error < TOL_APPR ) break;
			i ++;
			if ( i == imax ) console.log( 'max iteration' );

		}

		const ctrlp = c.ctrlPoints;
		const newCtrlPoints = this.OffsetControlPolygon( ctrlp );
		const offsetCurve = new NurbsCurve( c.deg, c.knots, newCtrlPoints, c.weights );

		return offsetCurve;

	}

	/**
	 * Tiller and Hanson’s method
	 * Translate each edge of the control polygon into normal direction
	 * */
	OffsetControlPolygon( ctrl, precision = 9 ) {

		const n = ctrl.length;
		const signed_offset_distance = this.signed_offset_distance;
		const slp = [];
		const pts = [];

		for ( let i = 0; i < n - 1; i ++ ) {

			const tangent = ctrl[ i + 1 ].sub( ctrl[ i ] ).normalize();
			slp.push( tangent );
			const pt = ctrl[ i ].add( ( this.z.cross( tangent ).mul( signed_offset_distance ) ) );
			pts.push( pt );

		}

		const res = [];
		res.push( pts[ 0 ] );

		pts.map( e => {

			e.x = Number( e.x.toFixed( precision ) );
			e.y = Number( e.y.toFixed( precision ) );
			e.z = Number( e.z.toFixed( precision ) );

		} );

		for ( let i = 0; i < n - 2; i ++ ) {

			const isStraight = slp[ i ].sub( slp[ i + 1 ] ).length() < 1e-12;
			res.push( isStraight ? pts[ i + 1 ] : intersect3DLines( pts[ i ], slp[ i ], pts[ i + 1 ], slp[ i + 1 ] ) );

		}

		res.push( ctrl[ n - 1 ].add( ( this.z.cross( slp[ n - 2 ] ).mul( signed_offset_distance ) ) ) );

		return res;

	}

	intersectOffset( c0, c1, obj3d ) {

		const arr = intersectCurves( c0, c1, 7, obj3d );
		const curves0 = [ c0 ];
		const curves1 = [ c1 ];

		arr.map( r => { // loop over intersection result, r = [ s, t, p, q ]

			const [ s, t ] = r.slice( 0, 3 );

			if ( this.isCusp( s ) || this.isCusp( t ) ) {

				console.log( '%c no need to split in cusp', 'color: #ff7597; font-weight: bold; background-color: #242424' );

			} else {

				curves0.map( c => {

					const c0c1 = c.split( s ); // split at intersect position

					if ( c0c1 ) {

						const index = curves0.indexOf( c );
						curves0.splice( index, 1, ...c0c1 );

					}

				} );

				curves1.map( c => {

					const c0c1 = c.split( t ); // split at intersect position

					if ( c0c1 ) {

						const index = curves1.indexOf( c );
						curves1.splice( index, 1, ...c0c1 );

					}

				} );

			}

		} );

		return [ curves0, curves1 ];

	}

}

function getChordlength( pts ) {

	let sum = 0;

	for ( let i = 1; i < pts.length; i ++ ) {

		sum += pts[ i ].sub( pts[ i - 1 ] ).length();

	}

	return sum;

}

export { OffsetCurve };
