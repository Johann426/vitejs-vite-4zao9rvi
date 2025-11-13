import { parameterize, deBoorKnots, globalCurveInterp, deWeight, knotMults, elevateDegree } from '../NurbsLib.js';
import { NurbsSurface } from './NurbsSurface.js';
import { Nurbs } from '../Nurbs.js';

class LoftedSurface extends NurbsSurface {

	constructor( curves ) {

		super();

		this.curves = curves !== undefined ? curves.map( c => c.clone() ) : [];

		this.initialize();

	}

	initialize() {

		if ( this.curves.length < 2 ) {

			console.warn( 'no of curves less than 2' );

		} else {

			const res = this._calcCtrlPoints( this.curves );
			super.initialize( ...res );

		}

	}

	_calcCtrlPoints( curves ) {

		const nj = curves.length;
		const deg_u = Math.max( ...curves.map( e => e.deg ) );
		let knot_u = [];

		// Raising degree & knot refinement
		for ( let j = 0; j < nj; j ++ ) {

			const c = curves[ j ];
			c.knots = normalize( c.knots );

			if ( c.deg < deg_u ) {

				if ( c instanceof Nurbs ) {

					const ctrl = c.weightedControlPoints;
					const arr = elevateDegree( c.deg, c.knots, ctrl, deg_u - c.deg );
					c.initialize( deg_u, arr[ 0 ], deWeight( arr[ 1 ] ), arr[ 1 ].map( e => e.w ) );

				} else {

					const ctrl = c.ctrlPoints;
					const arr = elevateDegree( c.deg, c.knots, ctrl, deg_u - c.deg );
					c.initialize( deg_u, arr[ 0 ], arr[ 1 ] );

				}

			}

			knot_u = mergeKnots( knot_u, c.knots );

		}

		for ( let j = 0; j < nj; j ++ ) {

			const c = curves[ j ];
			knotRefinement( c, knot_u );

		}

		// using common knot vector & degree,
		const ni = knot_u.length - deg_u - 1;
		const n = 20; //ni;
		const sum = new Array( nj ).fill( 0.0 );
		// v-directional parameterization (this process has significant effect on NetworkedSurface)
		for ( let i = 0; i < n; i ++ ) {

			const pts = curves.map( c => {

				const t = c.tmin + i / ( n - 1 ) * ( c.tmax - c.tmin );
				return c.getPointAt( t );

			} );
			const prm = parameterize( pts, 'chordal' );
			prm.map( ( e, i ) => sum[ i ] += e );

		}

		// const prm_v = sum.map( e => e / n );
		const prm_v = normalize( sum.map( e => e / n ) );
		const deg_v = nj - 1 > 3 ? 3 : nj - 1;
		// assign knot_v averaged over degree number of parameters
		const knot_v = deBoorKnots( deg_v, prm_v );
		const ctrl = Array.from( Array( nj ), () => new Array() );
		const w = Array.from( Array( nj ), () => new Array() );

		for ( let i = 0; i < ni; i ++ ) {

			const p = curves.map( c => c.ctrlPoints[ i ] );

			const q = globalCurveInterp( deg_v, prm_v, knot_v, p );

			for ( let j = 0; j < nj; j ++ ) {

				ctrl[ j ][ i ] = q[ j ];
				w[ j ][ i ] = 1.0;

			}

		}

		return [ deg_u, deg_v, knot_u, knot_v, ctrl, w ];

	}

	add( c ) {

		this.curves.push( c );
		this.needsUpdate = true;

	}

	getPointAt( s, t ) {

		if ( this.needsUpdate ) {

			this.initialize();
			this.needsUpdate = false;

		}

		return super.getPointAt( s, t );

	}

	reverseCurve() {

		console.warn( '' );

	}

}

function mergeKnots( knot0, knot1 ) {

	const arr0 = knotMults( knot0 );
	const arr1 = knotMults( knot1 );

	for ( let j = 0; j < arr0.length; j ++ ) {

		const e = arr0[ j ];
		let flag = true;

		for ( let i = 0; i < arr1.length; i ++ ) {

			if ( arr1[ i ].knot === e.knot ) {

				if ( arr1[ i ].mult < e.mult ) arr1[ i ].mult = e.mult;
				flag = false;

			}

		}

		if ( flag ) arr1.push( e );

	}

	const knots = [];

	for ( let i = 0; i < arr1.length; i ++ ) {

		for ( let j = 0; j < arr1[ i ].mult; j ++ ) {

			knots.push( Number( arr1[ i ].knot ) );

		}

	}

	return knots.sort( ( a, b ) => a - b );

}

function normalize( knot ) {

	const max = knot[ knot.length - 1 ];
	return knot.map( e => Number( ( e / max ).toFixed( 15 ) ) );

}

function knotRefinement( curve, knot ) {

	const knot0 = curve.knots;
	const knot1 = knot;

	const knotmults0 = knotMults( knot0 );
	const knotmults1 = knotMults( knot1 );

	for ( let j = 0; j < knotmults1.length; j ++ ) {

		const e = knotmults1[ j ];
		let isNew = true;

		for ( let i = 0; i < knotmults0.length; i ++ ) {

			if ( knotmults0[ i ].knot === e.knot ) {

				while ( knotmults0[ i ].mult < e.mult ) {

					curve.insertKnotAt( e.knot );
					knotmults0[ i ].mult ++;

				}

				isNew = false;

			}

		}

		if ( isNew ) {

			for ( let i = 0; i < e.mult; i ++ ) {

				curve.insertKnotAt( e.knot );

			}

		}

	}

}

export { LoftedSurface };
