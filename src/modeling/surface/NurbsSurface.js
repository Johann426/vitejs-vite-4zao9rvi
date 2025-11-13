import { nurbsSurfacePoint, weightedCtrlp, deWeight, surfKnotInsert, nurbsSurfaceDers } from '../NurbsLib.js';

class NurbsSurface {

	// ctrlp[ j ][ i ], weight[ j ][ i ] : two-dimensional array, j is v-direction and i is u-direction
	constructor( deg_u, deg_v, knot_u, knot_v, ctrlp, weight ) {

		if ( arguments.length >= 5 ) this.initialize( deg_u, deg_v, knot_u, knot_v, ctrlp, weight );

	}

	get ctrlPoints() {

		return this.ctrlpw.map( pts => deWeight( pts ) );

	}

	get weights() {

		return this.ctrlpw.map( pts => pts.map( pt => pt.w ) );

	}

	initialize( deg_u, deg_v, knot_u, knot_v, ctrlp, weight ) {

		this.deg = [ deg_u, deg_v ];

		this.knot = [ knot_u, knot_v ];

		const ni = this.knot[ 0 ].length - this.deg[ 0 ] - 1;

		const nj = this.knot[ 1 ].length - this.deg[ 1 ] - 1;

		this.ctrlpw = Array.from( Array( nj ), () => new Array() );

		const w = weight !== undefined ? weight : Array.from( Array( nj ), () => new Array( ni ).fill( 1.0 ) );

		for ( let j = 0; j < nj; j ++ ) {

			this.ctrlpw[ j ] = weightedCtrlp( ctrlp[ j ], w[ j ] );

		}

	}

	insertKnotAt( s, t ) {

		surfKnotInsert( this.deg[ 0 ], this.deg[ 1 ], this.knot[ 0 ], this.knot[ 1 ], this.ctrlpw, s, t );

	}

	getPointAt( s, t ) {

		const ni = this.knot[ 0 ].length - this.deg[ 0 ] - 1;
		const nj = this.knot[ 1 ].length - this.deg[ 1 ] - 1;
		const deg = this.deg;
		const knot = this.knot;
		const ctrlpw = this.ctrlpw;
		return nurbsSurfacePoint( ni, nj, deg[ 0 ], deg[ 1 ], knot[ 0 ], knot[ 1 ], ctrlpw, s, t );

	}

	getPoints( n, m ) {

		const p = [];

		for ( let j = 0; j < m; j ++ ) {

			const tmin = this.knot[ 1 ] ? this.knot[ 1 ][ 0 ] : 0.0;
			const tmax = this.knot[ 1 ] ? this.knot[ 1 ][ this.knot[ 1 ].length - 1 ] : 1.0;
			p[ j ] = [];
			const t = tmin + j / ( m - 1 ) * ( tmax - tmin );

			for ( let i = 0; i < n; i ++ ) {

				const smin = this.knot[ 0 ] ? this.knot[ 0 ][ 0 ] : 0.0;
				const smax = this.knot[ 0 ] ? this.knot[ 0 ][ this.knot[ 0 ].length - 1 ] : 1.0;
				const s = smin + i / ( n - 1 ) * ( smax - smin );

				p[ j ][ i ] = this.getPointAt( s, t );

			}

		}

		return p;

	}

	getDerivatives( s, t, d = 2 ) {

		const ni = this.knot[ 0 ].length - this.deg[ 0 ] - 1;
		const nj = this.knot[ 1 ].length - this.deg[ 1 ] - 1;

		return nurbsSurfaceDers( ni, nj, this.deg[ 0 ], this.deg[ 1 ], this.knot[ 0 ], this.knot[ 1 ], this.ctrlpw, s, t, d );

	}

	/**
	 * Find the closest parametric position on the surface(S) from a given point(P).
	 *
	 * The distance from P to S is minimized when f = g = 0, where
	 * f = Su • ( S - P ) = 0
	 * g = Sv • ( S - P ) = 0
	 *
	 * To obtain the candidate parameter s and t, Newton iteration is used
	 *
	 * s* = s - f / f'
	 * t* = t - g / g'
	 *
	 * Let
	 *
	 * δ = ⌈ Δs ⌉ = ⌈ s* - s ⌉
	 *     ⌊ Δt ⌋   ⌊ t* - t ⌋
	 *
	 * J =  ⌈ fu  fv ⌉ = ⌈ |Su|^2 + r*Suu,  Su*Sv + r*Suv ⌉
	 *      ⌊ gu  gv ⌋   ⌊  Su*Sv + r*Svu, |Sv|^2 + r*Svv ⌋
	 *
	 * κ = ⌈ -f ⌉
	 *     ⌊ -g ⌋
	 *
	 * We must solve 2 x 2 system of linear equations, Jδ = κ
	 *
	 * ⌈ |Su|^2 + r*Suu,  Su*Sv + r*Suv ⌉ ⌈ Δs ⌉ = ⌈ -f ⌉
	 * ⌊  Su*Sv + r*Svu, |Sv|^2 + r*Svv ⌋ ⌊ Δt ⌋   ⌊ -g ⌋
	 *
	 * where, convergence criteria,
	 *
	 * Δs < epsilon
	 * Δt < epsilon
	 *
	 * and orthogonal criteria,
	 *
	 * f = Su • ( S - P ) < epsilon
	 * g = Sv • ( S - P ) < epsilon
	 *
	 * and coincidence criteria (point lies on the curve),
	 *
	 * S(s,t) - P < epsilon
	 *
	 * then obtain a new set of parameters (denoted by *)
	 * s* = s + Δs
	 * t* = t + Δt
	 *
	 */
	closestPosition( v ) {

		// Evaluate curve points at n equally spaced parametric position
		let i, s, t, pts;
		s, t = 0;
		let min = this.getPointAt( 0, 0 ).sub( v ).length();
		const n = 128;

		for ( let j = 1; j <= n; j ++ ) {

			for ( i = 1; i <= n; i ++ ) {

				const d = this.getPointAt( i / n, j / n ).sub( v ).length();

				// choose one having the minimum distance from a given point as initial candidate.
				if ( d < min ) {

					s = i / n;
					t = j / n;
					min = d;

				}

			}

		}

		const EPSILON = Number.EPSILON;
		i = 0;
		// Newton iteration
		while ( i < 20 ) {

			const ders = this.getDerivatives( s, t, 2 );
			pts = ders[ 0 ][ 0 ];
			const r = pts.clone().sub( v );
			if ( r.length() < EPSILON ) break;
			const Su = ders[ 1 ][ 0 ];
			const Sv = ders[ 0 ][ 1 ];
			const Suu = ders[ 2 ][ 0 ];
			const Svv = ders[ 0 ][ 2 ];
			const Suv = ders[ 1 ][ 1 ];
			const Svu = ders[ 1 ][ 1 ];
			const f = Su.clone().dot( r ); // f =  Su • ( S - P )
			const g = Sv.clone().dot( r ); // g = Sv • ( S - P )
			const J00 = Su.clone().dot( Su ) + Suu.clone().dot( r );
			const J01 = Su.clone().dot( Sv ) + Suv.clone().dot( r );
			const J10 = Su.clone().dot( Sv ) + Svu.clone().dot( r );
			const J11 = Sv.clone().dot( Sv ) + Svv.clone().dot( r );
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

			s += ds;
			if ( s > 1.0 ) s = 1.0;
			if ( s < 0.0 ) s = 0.0;

			t += dt;
			if ( t > 1.0 ) t = 1.0;
			if ( t < 0.0 ) t = 0.0;

			// t* - t  < e1
			const cr1 = Math.abs( ds ) < EPSILON && Math.abs( dt ) < EPSILON; // is converged?

			// C' • ( C - P ) < e2
			const cr2 = Math.abs( f ) < EPSILON && Math.abs( g ) < EPSILON; // is orthogonal?

			if ( cr1 && cr2 ) {

				console.log( 'criteria 1 ', ds, dt );
				console.log( 'criteria 2 ', f, g );
				return [ t, pts ];

			}

			i ++;

			if ( i == 20 ) console.log( 'imax', ds, dt, f, g );

		}

		return [ s, t, pts ];

	}

	closestPoint( v ) {

		const res = this.closestPosition( v );
		return res[ 2 ];

	}

	transpose() {

		this.deg.reverse();
		this.knot.reverse();
		this.ctrlpw = transpose( this.ctrlpw );
		return this;

	}

}

function transpose( matrix ) {

	return matrix[ 0 ].map( ( col, i ) => matrix.map( row => row[ i ] ) );

}

export { NurbsSurface };
