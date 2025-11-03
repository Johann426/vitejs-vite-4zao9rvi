import { deBoorKnots, globalCurveInterp, knotMults } from '../NurbsLib.js';
import { LoftedSurface } from './LoftedSurface.js';
import { NurbsSurface } from './NurbsSurface.js';

//Interpolation of a Bidirectional Curve Network
class NetworkedSurface extends NurbsSurface {

	constructor( arr0, arr1 ) {

		super();

		this.curves = new Array( 2 );

		this.curves[ 0 ] = arr0 !== undefined ? arr0.map( e => e.clone() ) : [];

		this.curves[ 1 ] = arr1 !== undefined ? arr1.map( e => e.clone() ) : [];

		if ( this.curves[ 0 ].length >= 2 && this.curves[ 1 ].length >= 2 ) this.initialize();

	}

	initialize() {

		const nodes = this.curves[ 0 ].map( c => c.designPoints );
		console.warn( 'this class should be revised to use the intersected points instead of using u-directional nodes' );
		const dmax_u = Math.max( ...this.curves[ 0 ].map( e => e.deg ) );
		const dmax_v = Math.max( ...this.curves[ 1 ].map( e => e.deg ) );

		// u-directional lofted surface(where, k = 0), and v-directional lofted surface(where, k = 1)
		const ni = nodes[ 0 ].length;
		const nj = nodes.length;
		const deg_u = dmax_u;//ni - 1 > 3 ? 3 : ni - 1;
		const deg_v = dmax_v;//nj - 1 > 3 ? 3 : nj - 1;
		const [ knot, ctrl ] = globalSurfInterp( ni, nj, deg_u, deg_v, nodes );

		const surfaces = []; // Gordon surfaces (two lofted surfaces and tensor product)
		surfaces[ 0 ] = new LoftedSurface( this.curves[ 0 ] );
		surfaces[ 1 ] = new LoftedSurface( this.curves[ 1 ] ).transpose();
		surfaces[ 2 ] = new NurbsSurface( deg_u, deg_v, knot.u, knot.v, ctrl );

		const knot_u_final = mergeKnots( mergeKnots( surfaces[ 0 ].knot[ 0 ], surfaces[ 1 ].knot[ 0 ] ), knot.u );
		const knot_v_final = mergeKnots( mergeKnots( surfaces[ 0 ].knot[ 1 ], surfaces[ 1 ].knot[ 1 ] ), knot.v );

		for ( let i = 0; i < surfaces.length; i ++ ) {

			surfKnotRefinement( surfaces[ i ], knot_u_final, true );
			surfKnotRefinement( surfaces[ i ], knot_v_final, false );

		}

		const p0 = surfaces[ 0 ].ctrlPoints;
		const p1 = surfaces[ 1 ].ctrlPoints;
		const p2 = surfaces[ 2 ].ctrlPoints;

		const ctrlp_final = p0.map( ( pts, j ) => pts.map( ( p, i ) => p.add( p1[ j ][ i ] ).sub( p2[ j ][ i ] ) ) );

		super.initialize( dmax_u, dmax_v, knot_u_final, knot_v_final, ctrlp_final );

	}

	add( c, isU ) {

		this.curves[ isU ? 0 : 1 ].push( c );
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

const decimals = 3;

function globalSurfInterp( ni, nj, deg_u, deg_v, pts ) {

	//compute parameter
	const prm = paramsOfSurf( ni, nj, pts, 'chordal' );

	//compute knot vector
	const knot = {

		'u': deBoorKnots( deg_u, prm.u ),
		'v': deBoorKnots( deg_v, prm.v )

	};

	//compute control points
	const ctrl = [];

	for ( let j = 0; j < nj; j ++ ) {

		ctrl[ j ] = globalCurveInterp( deg_u, prm.u, knot.u, pts[ j ] );

	}

	for ( let i = 0; i < ni; i ++ ) {

		const r = [];

		for ( let j = 0; j < nj; j ++ ) {

			r[ j ] = ctrl[ j ][ i ];

		}

		const ctrlp = globalCurveInterp( deg_v, prm.v, knot.v, r );

		for ( let j = 0; j < nj; j ++ ) {

			ctrl[ j ][ i ] = ctrlp[ j ];

		}

	}

	return [ knot, ctrl ];

}

function paramsOfSurf( ni, nj, points, curveType ) {

	const prm = {

		'u': new Array( ni ).fill( 0 ),
		'v': new Array( nj ).fill( 0 )

	};

	for ( let j = 0; j < nj; j ++ ) {

		let sum = 0.0;
		const tmp = [];

		for ( let i = 1; i < ni; i ++ ) {

			const del = points[ j ][ i ].sub( points[ j ][ i - 1 ] );
			const len = curveType === 'centripetal' ? Math.sqrt( del.length() ) : del.length();
			sum += len;
			tmp[ i ] = sum;

		}

		for ( let i = 1; i < ni; i ++ ) {

			tmp[ i ] /= sum;
			prm.u[ i ] += tmp[ i ] / nj;

		}

	}

	prm.u[ 0 ] = 0.0;

	prm.u[ ni - 1 ] = 1.0; //last one to be 1.0 instead of 0.999999..

	for ( let i = 0; i < ni; i ++ ) {

		let sum = 0.0;
		const tmp = [];

		for ( let j = 1; j < nj; j ++ ) {

			const del = points[ j ][ i ].sub( points[ j - 1 ][ i ] );
			const len = curveType === 'chordal' ? del.length() : Math.sqrt( del.length() );
			sum += len;
			tmp[ j ] = sum;

		}

		for ( let j = 1; j < nj; j ++ ) {

			tmp[ j ] /= sum;
			prm.v[ j ] += tmp[ j ] / ni;

		}

	}

	prm.v[ 0 ] = 0.0;

	prm.v[ nj - 1 ] = 1.0; //last one to be 1.0 instead of 0.999999..

	return prm;

}

function mergeKnots( knot0, knot1 ) {

	const arr0 = knotMults( knot0.map( e => e.toFixed( decimals ) ) );
	const arr1 = knotMults( knot1.map( e => e.toFixed( decimals ) ) );

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

function knotRefinement( curve, knot ) {

	const knotmults0 = knotMults( curve.knots.map( e => Number( e.toFixed( decimals ) ) ) );
	const knotmults1 = knotMults( knot.map( e => Number( e.toFixed( decimals ) ) ) );

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

function surfKnotRefinement( surf, knot, udir ) {

	const knot_uv = udir ? surf.knot[ 0 ] : surf.knot[ 1 ];
	const knotmults0 = knotMults( knot_uv.map( e => Number( e.toFixed( decimals ) ) ) );
	const knotmults1 = knotMults( knot.map( e => Number( e.toFixed( decimals ) ) ) );

	for ( let j = 0; j < knotmults1.length; j ++ ) {

		const e = knotmults1[ j ];
		let isNew = true;

		for ( let i = 0; i < knotmults0.length; i ++ ) {

			if ( knotmults0[ i ].knot === e.knot ) {

				while ( knotmults0[ i ].mult < e.mult ) {

					udir ? surf.insertKnotAt( e.knot, 0 ) : surf.insertKnotAt( 0, e.knot ); // v-directional knot incertion
					knotmults0[ i ].mult ++;

				}

				isNew = false;

			}

		}

		if ( isNew ) {

			for ( let i = 0; i < e.mult; i ++ ) {

				udir ? surf.insertKnotAt( e.knot, 0 ) : surf.insertKnotAt( 0, e.knot ); // v-directional knot incertion

			}

		}

	}

}

export { NetworkedSurface };
