import { Nurbs } from './Nurbs.js';
import { NurbsCurve } from './NurbsCurve.js';
import { deWeight, elevateDegree, reverseDirection, Vector } from './NurbsLib.js';
import { fx } from './Interpolation.js';

/**
 * Find the closest parametric position on the curve from a given surface.
 * Caller is required to provide a good initial guess.
 *
 * The distance vector from the surface to the curve
 *
 * r = C(t) - S
 *
 * is minimized when f = 0, where
 *
 * f = r · C' = 0
 *
 * t can be obtained by numerical iteration (Newton's method),
 *
 * Δt = - f / f'
 *
 * where, convergence criteria,
 *
 * Δt < epsilon
 *
 * and orthogonal criteria,
 *
 * f < epsilon
 *
 * and coincidence criteria,
 *
 * r < epsilon
 *
 * then obtain a new parameter (denoted by *)
 *
 * t* = t + Δt
 *
 */
function curveSurface( C, S, t0, sor = 1 ) { //For now, no initial guess of surface, it assume that S.closestPoint() provide a good initial guess.

	const n = 128;
	const tmin = C.tmin;
	const tmax = C.tmax;
	let t = t0 ? t0 : 0.5 * ( this.tmin + this.tmax );
	let min = C.getPointAt( t0 ).sub( S.closestPoint( C.getPointAt( t0 ) ) ).length();
	let i, pts;

	// Initial guess by evaluating curve points at n equally spaced parametric position
	for ( i = 1; i < n - 1; i ++ ) {

		const s = tmin + i / ( n - 1 ) * ( tmax - tmin );
		const component = C.getPointAt( s );
		const d = component.sub( S.closestPoint( component ) ).length();

		// choose one having the minimum distance from a given point as initial candidate.
		if ( d < min ) {

			t = s;
			min = d;

		}

	}

	const EPSILON = Number.EPSILON;
	i = 0;
	// Newton iteration
	const imax = 400; //1000;
	while ( i < imax ) {

		const ders = C.getDerivatives( t, 2 );
		pts = ders[ 0 ];
		const r = pts.sub( S.closestPoint( pts ) );

		if ( r.length() < EPSILON ) {

			// console.log( 'i = ' + i, ',coincidence' );
			break;

		}

		const f = r.dot( ders[ 1 ] );
		const df = ders[ 1 ].dot( ders[ 1 ] ) + ders[ 2 ].dot( r );
		const dt = - sor * f / df;
		const old = t;
		t += dt;
		if ( t > tmax ) t = tmax;
		if ( t < tmin ) t = tmin;

		const abs = Math.abs;
		// t* - t  < e
		const cr1 = abs( t - old ) < EPSILON; // is converged?
		// r · C' < e
		const cr2 = abs( f ) < EPSILON; // is orthogonal?

		if ( cr1 || cr2 ) {

			// console.log( 'i = ' + i );
			// console.log( 'criteria 1, dt=', dt );
			// console.log( 'criteria 2, f=', f );
			break;

		}

		i ++;

		// if ( i == imax ) console.log( 'imax', dt, f );

	}

	return t;

}

/**
 * Find the closest parametric positions on two curves.
 * Caller is required to provide a good pair of initial guess.
 *
 * The distance from C1 to C2
 *
 * r = C2(t) - C1(s)
 *
 * is minimized when f = g = 0, where
 *
 * f = r · C1' = 0
 * g = r · C2' = 0
 *
 * s and t can be obtained by numerical iteration (Newton's method),
 *
 * s* = s - f / f'	,	t* = t - f / f'
 * s* = s - g / g'	,	t* = t - g / g'
 *
 * Let
 *
 * δ = ⌈ Δs ⌉ = ⌈ s* - s ⌉
 *     ⌊ Δt ⌋   ⌊ t* - t ⌋
 *
 * J =  ⌈ fs  ft ⌉ = ⌈ -|C1'|^2 + r · C1",     C2' · C1'     ⌉
 *      ⌊ gs  gt ⌋   ⌊     -C1' · C2'    , |C2'|^2 + r · C2" ⌋
 *
 * κ = ⌈ -f ⌉
 *     ⌊ -g ⌋
 *
 * We must solve 2 x 2 system of linear equations, Jδ = κ
 *
 * ⌈ -|C1'|^2 + r · C1",     C2' · C1'     ⌉ ⌈ Δs ⌉ = ⌈ -f ⌉
 * ⌊     -C1' · C2'    , |C2'|^2 + r · C2" ⌋ ⌊ Δt ⌋   ⌊ -g ⌋
 *
 * where, convergence criteria,
 *
 * Δs < epsilon
 * Δt < epsilon
 *
 * and orthogonal criteria,
 *
 * f = r · C1' < epsilon
 * g = r · C2' < epsilon
 *
 * and coincidence criteria (point lies on the curve),
 *
 * r = C2 - C1 < epsilon
 *
 * then obtain a new set of parameters (denoted by *)
 *
 * s* = s + Δs
 * t* = t + Δt
 *
 */
function closestPosition( C1, C2, s0, t0 ) {

	// s0 and t0 are initial candidates
	const smin = C1.knots[ 0 ];
	const smax = C1.knots[ C1.knots.length - 1 ];
	const tmin = C2.knots[ 0 ];
	const tmax = C2.knots[ C2.knots.length - 1 ];
	let i, s, t, p1, p2;
	s = s0;
	t = t0;

	const EPSILON = Number.EPSILON;
	i = 0;
	// Newton iteration
	const imax = 100;
	while ( i < imax ) {

		const der1 = C1.getDerivatives( s, 2 );
		p1 = der1[ 0 ];
		const der2 = C2.getDerivatives( t, 2 );
		p2 = der2[ 0 ];
		const r = p2.sub( p1 );

		if ( r.length() < EPSILON ) {

			// console.log( 'i = ' + i, ',coincidence' );
			break;

		}

		const f = r.dot( der1[ 1 ] );
		const g = r.dot( der2[ 1 ] );
		const J00 = - der1[ 1 ].dot( der1[ 1 ] ) + der1[ 2 ].dot( r );
		const J01 = der2[ 1 ].dot( der1[ 1 ] );
		const J10 = - J01;
		const J11 = der2[ 1 ].dot( der2[ 1 ] ) + der2[ 2 ].dot( r );
		/**
		 * by solving 2 x 2 linear algebra
		 *
		 * ⌈ ds ⌉ = 1 / det ⌈ J11  -J01 ⌉ ⌈ -f ⌉
		 * ⌊ dt ⌋           ⌊-J10   J00 ⌋ ⌊ -g ⌋
		 *
		 */
		const det = J00 * J11 - J01 * J10;
		const ds = ( - J11 * f + J01 * g ) / det;
		const dt = ( J10 * f - J00 * g ) / det;
		const olds = s;
		s += ds;
		if ( s > smax ) s = smax;
		if ( s < smin ) s = smin;

		const oldt = t;
		t += dt;
		if ( t > tmax ) t = tmax;
		if ( t < tmin ) t = tmin;

		const abs = Math.abs;
		// t* - t  < e
		const cr1 = abs( s - olds ) < EPSILON && abs( t - oldt ) < EPSILON; // is converged?
		// r · C' < e
		const cr2 = abs( f ) < EPSILON && abs( g ) < EPSILON; // is orthogonal?

		if ( cr1 || cr2 ) {

			// console.log( 'i = ' + i );
			// console.log( 'criteria 1, ds=', ds, 'dt=', dt );
			// console.log( 'criteria 2, f=', f, 'g=', g );
			break;

		}

		i ++;
		// if ( i == imax ) console.log( 'imax', ds, dt, f, g );

	}

	return [ s, t ];

}

function closestPoint( C1, C2, s0, t0 ) {

	const [ s, t ] = closestPosition( C1, C2, s0, t0 );

	return [ C1.getPointAt( s ), C2.getPointAt( t ) ];

}

function splitCurveAtPoints( curve, pts ) {

	const curves = [];
	curves.push( curve );

	pts.map( p => {

		curves.map( c => {

			const t = c.closestPosition( p );
			const res = c.split( t ); //res = [ c0, c1 ]

			if ( res ) {

				const index = curves.indexOf( c );
				curves.splice( index, 1 );
				res.map( e => curves.push( e ) );

			}

		} );

	} );

	return curves;

}

function splitCurveAtPositions( curve, pos ) {

	const curves = [];
	curves.push( curve );

	pos.map( t => {

		curves.map( c => {

			const res = c.split( t ); //res = [ c0, c1 ]

			if ( res ) {

				const index = curves.indexOf( c );
				curves.splice( index, 1 );
				res.map( e => curves.push( e ) );

			}

		} );

	} );

	return curves;

}

function joinCurves( curves ) {

	const tol = 1e-9;
	const deg = Math.max( ...curves.map( e => e.deg ) );
	const isolated = [];

	while ( curves.length > 1 ) {

		const c0 = toNurbs( curves.pop() );
		let joined = false;

		curves.map( ( e, i ) => {

			let able = false;
			let reversed = false;
			//Check start and end points of two curves
			let ctrl0 = c0.weightedControlPoints;
			let knot0 = c0.knots;
			const ps0 = deWeight( ctrl0[ 0 ] );
			const pe0 = deWeight( ctrl0[ ctrl0.length - 1 ] );

			const c1 = toNurbs( e );
			let ctrl1 = c1.weightedControlPoints;
			let knot1 = c1.knots;
			const ps1 = deWeight( ctrl1[ 0 ] );
			const pe1 = deWeight( ctrl1[ ctrl1.length - 1 ] );

			if ( pe0.sub( ps1 ).length() < tol ) { //

				able = true;

			} else if ( pe0.sub( pe1 ).length() < tol ) {

				reverseDirection( knot1, ctrl1 );
				able = true;

			} else if ( ps0.sub( ps1 ).length() < tol ) {

				reverseDirection( knot0, ctrl0 );
				able = true;
				reversed = true;

			} else if ( ps0.sub( pe1 ).length() < tol ) {

				reverseDirection( knot0, ctrl0 );
				reverseDirection( knot1, ctrl1 );
				able = true;
				reversed = true;

			}

			if ( able ) {

				const deg0 = c0.deg;
				const deg1 = c1.deg;

				if ( deg0 < deg ) {

					[ knot0, ctrl0 ] = elevateDegree( deg0, knot0, ctrl0, deg - deg0 );

				}

				if ( deg1 < deg ) {

					[ knot1, ctrl1 ] = elevateDegree( deg1, knot1, ctrl1, deg - deg1 );

				}

				const gap = knot0.pop() - knot1.shift();
				knot1.splice( 0, deg );
				const knot = knot0.concat( knot1.map( e => e + gap ) );
				const ctrl = ctrl0.concat( ctrl1.slice( 1 ) );
				reversed ? reverseDirection( knot, ctrl ) : null;
				c0.initialize( deg, knot, ctrl );
				curves.splice( i, 1 );
				joined = true;

			}

		} );

		joined ? curves.push( c0 ) : isolated.push( c0 );

	}

	// Now, curves have only one isolated element, or it is empty(in case of final element joined).
	isolated.map( e => curves.push( e ) );

	return curves;

}

function toNurbs( curve ) { //convert curve into Nurbs, if it has deg, knot, ctrl

	const isNurbs = curve instanceof Nurbs;

	if ( isNurbs ) {

		return curve;
		return new NurbsCurve( curve.deg, curve.knots, curve.weightedControlPoints );

	} else {

		const ctrlp = curve.ctrlPoints;
		return ctrlp ? new NurbsCurve( curve.deg, curve.knots, ctrlp ) : new NurbsCurve();

	}

}

// function initializeCurve( curve, deg, knot, ctrlp, weight ) {

// 	if ( curve instanceof Nurbs ) {

// 		curve.initialize( deg, knot, ctrlp, weight );

// 	} else {

// 		curve.initialize( deg, knot, ctrlp );

// 	}

// }

class Tensor {

	constructor( ...data ) {

		this.components = toComponents( data );

		function toComponents( data ) {

			return Array.isArray( data ) ? data.map( e => toComponents( e ) ) : data;

		}

	}

	get rank() {

		let rank = 0;
		let component = this.components;

		while ( Array.isArray( component ) ) {

			rank ++;
			component = component[ 0 ];

		}

		return rank;

	}

	verify( data ) {

		if ( Array.isArray( data ) ) {

			const l = data[ 0 ].length;
			data.map( ( e, i ) => {

				e.length !== l ? console.warn( 'data length is different' ) : null;

			} );
			return data.map( e => this.verify( e ) );

		} else {

			return data;

		}

	}

}


class Deform {

	constructor( ...data ) {

		this.ctrlp = [];

		data.map( v => {

			if ( Array.isArray( v ) ) {

				this.dim = 2;
				this.ctrlp.push( v.map( e => new Vector( e.x, e.y, e.z, e.w ) ) );

			} else {

				this.dim = 1;
				this.ctrlp.push( new Vector( v.x, v.y, v.z, v.w ) );

			}

		} );

	}

	getWeightAt( p, keyX = 'x', keyY = 'w' ) {

		const x = this.ctrlp.map( v => this.dim === 1 ? v[ keyX ] : v.map( e => e[ keyX ] ) );
		const y = this.ctrlp.map( v => this.dim === 1 ? v[ keyY ] : v.map( e => e[ keyY ] ) );
		const res = fx( x, y, [ p[ keyX ] ] );
		return Number( res[ 0 ].toFixed( 15 ) );

	}

}

class Box4 {

	constructor( min = new Vector( 0, 0, 0, 0 ), max = new Vector( 1, 1, 1, 1 ) ) {

		this.min = min;
		this.max = max;

	}

	containsPoint( p ) {

		return ( p.x >= this.min.x && p.x <= this.max.x ) &&
			   ( p.y >= this.min.y && p.y <= this.max.y ) &&
			   ( p.z >= this.min.z && p.z <= this.max.z );

	}

	clampPoint( p ) {

		// assumes min < max, componentwise
		const x = Math.max( this.min.x, Math.min( this.max.x, p.x ) );
		const y = Math.max( this.min.y, Math.min( this.max.y, p.y ) );
		const z = Math.max( this.min.z, Math.min( this.max.z, p.z ) );
		return new Vector( x, y, z );

	}

	distanceToPoint( p ) {

		const clampedPoint = this.clampPoint( p );
		return clampedPoint.sub( p ).length();

	}

}

class Sphere4 {

	constructor( center = new Vector( 0, 0, 0, 1 ), radius = 1, option = 'linear' ) {

		this.center = center;
		this.radius = radius;
		this.option = option;

	}

	containsPoint( p ) { // we are using multiplications because is faster than calling Math.pow

		return this.distanceToPoint( p ) <= 0;

	}

	distanceToPoint( p ) {

		const [ x, y, z ] = this.center.components;
		const res = Math.sqrt( ( p.x - x ) * ( p.x - x ) + ( p.y - y ) * ( p.y - y ) + ( p.z - z ) * ( p.z - z ) ) - this.radius;
		return Number( res.toFixed( 15 ) );

	}

	getWeightAt( p ) { // lenear variation

		const d = this.distanceToPoint( p );

		if ( d < 0 ) {

			const x = d / this.radius + 1; // from 0 to 1
			const exp = this.option == 'linear' ? 1 : 2;
			const res = ( 1 - x ** exp ) * this.center.w;
			return Number( res.toFixed( 15 ) );

		} else {

			return 0;

		}

	}

}

// const sphere = new Sphere4();
// sphere.option = 'nonlinear';
// const p = new Vector( 0.8, 0, 0 );
// console.log( sphere.distanceToPoint( p ) );
// console.log( sphere.containsPoint( p ) );
// console.log( sphere.getWeightAt( p ) );

// const tensor = new Tensor( Array( [ 0, 0, 0, 1 ], [ 1, 1, 1, 0 ], [ 0, 1, 0, 1 ] ), Array( [ 0, 0, 0, 1 ], [ 1, 1, 1, 1 ], [ 0, 1, 0, 1 ] ) );
// console.log( 'rank=', tensor.rank );
// console.log( tensor );

// const p0 = new Vector( 0, 0, 0, 0 );
// const p1 = new Vector( 0.5, 0, 0, 0.4 );
// const p2 = new Vector( 1.0, 0, 0, 1 );

// const deform = new Deform( p0, p1, p2 );
// console.log( deform );
// console.log( deform.getWeightAt( new Vector( 1.0, 0, 0 ), 'x', 'w' ) );

export { curveSurface, closestPosition, closestPoint, joinCurves, splitCurveAtPositions, splitCurveAtPoints, Box4, Sphere4, Deform };
