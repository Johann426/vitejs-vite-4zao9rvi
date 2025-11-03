/**
 * Code by Johann426
 * A number of functions implemented here are based on the pseudo code of The NURBS Book, Piegl & Tiller.
 */
import { array } from '../vectorious/index.esm.js';

const EPSILON = Number.EPSILON;
const PI = Math.PI;
const abs = Math.abs;
const max = Math.max;
const min = Math.min;
const sin = Math.sin;
const cos = Math.cos;
const sqrt = Math.sqrt;
const ceil = Math.ceil;
const floor = Math.floor;

/**
 * Assign parametric value to each point by chordal length (or centripetal) method.
 */
function parameterize( points, curveType ) {

	const n = points.length;
	const prm = [ 0.0 ];
	let sum = 0.0;

	for ( let i = 1; i < n; i ++ ) {

		const del = points[ i ].sub( points[ i - 1 ] );
		const len = curveType === 'chordal' ? del.length() : sqrt( del.length() ); // Otherwise, use centripetal
		sum += len;
		prm[ i ] = sum;

	}

	return prm;

}

// Assign knot vector, length = n + order + 2
function assignKnot( deg, prm ) {

	const n = prm.length;
	const knot = [];

	for ( let i = 0; i <= deg; i ++ ) knot.push( prm[ 0 ] );

	if ( deg > 1 ) {

		for ( let i = 0; i <= n - deg; i ++ ) {

			knot[ i + deg + 1 ] = prm[ i + 1 ]; // see OCCT/src/GeomAPI/GeomAPI_Interpolate.cxx

		}

	} else if ( deg === 1 ) {

		knot.push( prm[ prm.length - 1 ] / 3 );
		knot.push( prm[ prm.length - 1 ] * 2 / 3 );

	} else { // deg == 0, do nothing

	}

	for ( let i = 0; i <= deg; i ++ ) knot.push( prm[ prm.length - 1 ] );
	return knot;

}

/**
 * Assign knot vector averaged over degree number of parameters, length = n + order
 */
function deBoorKnots( deg, prm ) {

	const n = prm.length;
	const knot = [];

	for ( let i = 0; i <= deg; i ++ ) { // multiplicity of degree + 1 at corner

		knot[ i ] = prm[ 0 ];
		knot[ i + n ] = prm[ prm.length - 1 ];

	}

	for ( let i = 1; i < n - deg; i ++ ) { // averaged over degree number of parameters

		let sum = 0.0;

		for ( let j = i; j < i + deg; j ++ ) {

			sum += prm[ j ];

		}

		knot[ i + deg ] = sum / deg;

	}

	return knot;

}

// Having 2 additional knots
function deBoorKnots2( deg, prm ) {

	const n = prm.length;
	const knot = [];

	for ( let i = 0; i <= deg; i ++ ) knot.push( prm[ 0 ] );

	if ( deg > 1 ) {

		for ( let i = 0; i <= n - deg; i ++ ) {

			let sum = 0.0;

			for ( let j = i; j < i + deg; j ++ ) {

				sum += prm[ j ];

			}

			knot[ i + deg + 1 ] = sum / deg;

		}

	} else if ( deg === 1 ) {

		knot.push( prm[ prm.length - 1 ] / 3 );
		knot.push( prm[ prm.length - 1 ] * 2 / 3 );

	} else { // deg == 0, do nothing

	}

	for ( let i = 0; i <= deg; i ++ ) knot.push( prm[ prm.length - 1 ] );
	return knot;

}

/**
 * Assign uniformly spaced knot vector.
 */
function uniformlySpacedknots( deg, n ) {

	const knot = [];

	for ( let i = 0; i <= deg; i ++ ) {

		knot[ i ] = 0.0;
		knot[ i + n ] = 1.0;

	}

	for ( let i = 1; i < n - deg; i ++ ) {

		for ( let j = i; j < i + deg; j ++ ) {

			knot[ i + deg ] = i / ( n - deg );

		}

	}

	return knot;

}

/**
 * Compute Greville points (Greville abscissae) defined to be the mean location of degree consecutive knots in the knot vector
 */
function calcGreville( deg, knot ) {

	const prm = [];

	for ( let i = 1; i < knot.length - deg; i ++ ) {

		let sum = 0;

		for ( let j = i; j < i + deg; j ++ ) {

			sum += knot[ j ];

		}

		prm.push( sum / deg );

	}

	return prm;

}

/**
 * Compute all nth-degree Bernstein polynomials. See The NURBS Book, page 21, algorithm A1.3
 * n : number of control points
 * t : parametric point
 */
function allBernstein( n, t ) {

	const t1 = 1.0 - t;
	const arr = new Array( n );
	arr[ 0 ] = 1.0;

	for ( let j = 1; j < n; j ++ ) {

		let saved = 0.0;

		for ( let i = 0; i < j; i ++ ) {

			const tmp = arr[ i ];
			arr[ i ] = saved + t1 * tmp;
			saved = t * tmp;

		}

		arr[ j ] = saved;

	}

	return arr;

}

/**
 * Compute point on Bezier curve. See The NURBS Book, page 22, algorithm A1.4
 * ctrl : control points
 * t : parameteric point
 */
function pointOnBezierCurve( ctrl, t ) {

	const n = ctrl.length;
	const b = allBernstein( n, t );
	let x = 0, y = 0, z = 0;

	for ( let j = 0; j < n; j ++ ) {

		x += b[ j ] * ctrl[ j ].x;
		y += b[ j ] * ctrl[ j ].y;
		z += b[ j ] * ctrl[ j ].z;

	}

	return new Vector( x, y, z );

}

function derBezier( ctrl, t, q = [] ) {

	const n = ctrl.length;
	const nm1 = n - 1;

	for ( let j = 0; j < nm1; j ++ ) {

		q[ j ] = new Vector( n, n, n );
		q[ j ].x *= ctrl[ j + 1 ].x - ctrl[ j ].x;
		q[ j ].y *= ctrl[ j + 1 ].y - ctrl[ j ].y;
		q[ j ].z *= ctrl[ j + 1 ].z - ctrl[ j ].z;

	}

	const v = new Vector( 0, 0, 0 );
	let b = allBernstein( nm1, t );

	for ( let j = 0; j < nm1; j ++ ) {

		v.x += b[ j ] * q[ j ].x;
		v.y += b[ j ] * q[ j ].y;
		v.z += b[ j ] * q[ j ].z;

	}

	return v;

}

function dersBezier( ctrl, t, n = 2 ) {

	const ders = [];
	ders.push( pointOnBezierCurve( ctrl, t ) );

	let p = ctrl;

	for ( let j = 0; j < n; j ++ ) {

		const q = [];
		ders.push( derBezier( p, t, q ) );
		p = q;

	}

	return ders;

}

function elevateDegreeBezier( ctrl ) {

	const n = ctrl.length;
	const q = [];
	q[ 0 ] = ctrl[ 0 ];

	for ( let i = 1; i < n; i ++ ) {

		const alpha = i / n;
		const x = ( 1 - alpha ) * ctrl[ i ].x + alpha * ctrl[ i - 1 ].x;
		const y = ( 1 - alpha ) * ctrl[ i ].y + alpha * ctrl[ i - 1 ].y;
		const z = ( 1 - alpha ) * ctrl[ i ].z + alpha * ctrl[ i - 1 ].z;
		q[ i ] = new Vector( x, y, z );

	}

	q[ n ] = ctrl[ n - 1 ];

	return q;

}

/*
 * Compute point on Bezier curve by deCasteljau algorithm. See The NURBS Book, page 24, algorithm A1.5
 * ctrl : control points
 * t : parameteric point
 */
function deCasteljau1( ctrl, t ) {

	const n = ctrl.length;
	const t1 = 1.0 - t;
	const q = ctrl.map( e => new Vector( e.x, e.y, e.z ) ); // new Vector3() needs to be assigned to q.  ctrl.slice() doesn't seem to work as expected

	for ( let j = 1; j < n; j ++ ) {

		for ( let i = 0; i < n - j; i ++ ) {

			q[ i ].x = t1 * q[ i ].x + t * q[ i + 1 ].x;
			q[ i ].y = t1 * q[ i ].y + t * q[ i + 1 ].y;
			q[ i ].z = t1 * q[ i ].z + t * q[ i + 1 ].z;

		}

	}

	return q[ 0 ];

}

/*
 * Determine the span index of knot vector in which parameter lies. See The NURBS Book, page 68, algorithm A2.1
 * deg : degree
 * knot : knot vector
 * n : number of control points
 * t : parameteric point
 */
function findIndexSpan( deg, knot, n, t ) {

	const nm1 = n - 1;

	//Make sure the parameter t is within the knots range
	if ( t >= knot[ n ] ) return nm1; //special case of t at the curve end
	if ( t <= knot[ deg ] ) return deg;

	//Find index of ith knot span(half-open interval)
	let low = deg;
	let high = n;
	let mid = floor( ( high + low ) / 2 );

	//Do binary search
	while ( t < knot[ mid ] || t >= knot[ mid + 1 ] ) {

		t < knot[ mid ] ? high = mid : low = mid;
		mid = floor( ( high + low ) / 2 );

	}

	return mid;

}

/*
 * Compute nonvanishing basis functions. See The NURBS Book, page 70, algorithm A2.2
 * deg : degree
 * knot : knot vector
 * span : index of knot vector at a parametric point
 * t : parameteric point
 */
function basisFuncs( deg, knot, span, t ) {

	const left = [];
	const right = [];
	const ni = [];
	ni[ 0 ] = 1.0;

	for ( let j = 1; j <= deg; j ++ ) {

		left[ j ] = t - knot[ span + 1 - j ];
		right[ j ] = knot[ span + j ] - t;
		let saved = 0.0;

		for ( let k = 0; k < j; k ++ ) {

			const tmp = ni[ k ] / ( right[ k + 1 ] + left[ j - k ] );
			ni[ k ] = saved + right[ k + 1 ] * tmp;
			saved = left[ j - k ] * tmp;

		}

		ni[ j ] = saved;

	}

	return ni;

}

/*
 * Compute nonzero basis functions and their derivatives, up to and including nth derivatives. See The NURBS Book, page 72, algorithm A2.3.
 * ders[k][j] is the kth derivative where 0 <= k <= n and 0 <= j <= degree
 * deg : degree
 * knot : knot vector
 * span : index of knot vector at a parametric point
 * n : order of the highest derivative to compute
 * t : parameteric point
 */
function dersBasisFunc( deg, knot, span, n, t ) {

	const order = deg + 1;
	const ndu = Array.from( Array( order ), () => new Array( order ) );
	const ders = Array.from( Array( n + 1 ), () => new Array( order ) );
	const left = new Array( order );
	const right = new Array( order );

	ndu[ 0 ][ 0 ] = 1.0;

	for ( let j = 1; j <= deg; j ++ ) {

		left[ j ] = t - knot[ span + 1 - j ];
		right[ j ] = knot[ span + j ] - t;
		let saved = 0.0;

		for ( let r = 0; r < j; r ++ ) {

			// Lower triangle
			ndu[ j ][ r ] = right[ r + 1 ] + left[ j - r ];
			const tmp = ndu[ r ][ j - 1 ] / ndu[ j ][ r ];

			// Upper triangle
			ndu[ r ][ j ] = saved + right[ r + 1 ] * tmp;
			saved = left[ j - r ] * tmp;

		}

		ndu[ j ][ j ] = saved;

	}

	for ( let j = 0; j <= deg; j ++ ) {

		ders[ 0 ][ j ] = ndu[ j ][ deg ]; // Load the basis funcs

	}

	// This section computes the derivatives (Eq. [2.9])
	for ( let r = 0; r <= deg; r ++ ) {	//Loop over function index

		let s1 = 0;
		let s2 = 1;	// Alternative rows in array a
		// two most recently computed rows a(k,j) and a(k-1,j)
		const a = Array.from( Array( 2 ), () => new Array( order ) );
		a[ 0 ][ 0 ] = 1.0;

		for ( let k = 1; k <= n; k ++ ) {	// Loop to compute kth derivative

			let d = 0.0;
			const rk = r - k;
			const pk = deg - k;

			if ( r >= k ) {

				a[ s2 ][ 0 ] = a[ s1 ][ 0 ] / ndu[ pk + 1 ][ rk ];
				d = a[ s2 ][ 0 ] * ndu[ rk ][ pk ];

			}

			const j1 = rk >= - 1 ? 1 : - rk;
			const j2 = r - 1 <= pk ? k - 1 : deg - r;

			for ( let j = j1; j <= j2; j ++ ) {

				a[ s2 ][ j ] = ( a[ s1 ][ j ] - a[ s1 ][ j - 1 ] ) / ndu[ pk + 1 ][ rk + j ];
				d += a[ s2 ][ j ] * ndu[ rk + j ][ pk ];

			}

			if ( r <= pk ) {

				a[ s2 ][ k ] = - a[ s1 ][ k - 1 ] / ndu[ pk + 1 ][ r ];
				d += a[ s2 ][ k ] * ndu[ r ][ pk ];

			}

			ders[ k ][ r ] = d;
			const j = s1; s1 = s2; s2 = j; //Switch rows

		}

	}

	// Multiply through by the correct factors (Eq. [2.9])
	let r = deg;

	for ( let k = 1; k <= n; k ++ ) {

		for ( let j = 0; j <= deg; j ++ ) {

			ders[ k ][ j ] *= r;

		}

		r *= ( deg - k );

	}

	return ders;

}

/*
 * Compute B-Spline curve point. See The NURBS Book, page 82, algorithm A3.1.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
*/
function curvePoint( deg, knot, ctrl, t ) {

	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nj = basisFuncs( deg, knot, span, t );
	let x = 0, y = 0, z = 0;

	for ( let j = 0; j <= deg; j ++ ) {

		x += nj[ j ] * ctrl[ span - deg + j ].x;
		y += nj[ j ] * ctrl[ span - deg + j ].y;
		z += nj[ j ] * ctrl[ span - deg + j ].z;

	}

	return new Vector( x, y, z );

}

/*
 * Compute derivatives of a B-Spline. See The NURBS Book, page 93, algorithm A3.2.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
 * n : order of the highest derivative to compute (default value is 2)
 */
function curveDers( deg, knot, ctrl, t, n = 2 ) {

	const v = [];
	// We allow n > degree, although the ders are 0 in this case (for nonrational curves),
	// but these ders are needed for rational curves
	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nders = dersBasisFunc( deg, knot, span, n, t );

	for ( let k = 0; k <= n; k ++ ) {

		v[ k ] = new Vector( 0, 0, 0 );

		for ( let j = 0; j <= deg; j ++ ) {

			const nder = nders[ k ][ j ];
			v[ k ].x += nder * ctrl[ span - deg + j ].x;
			v[ k ].y += nder * ctrl[ span - deg + j ].y;
			v[ k ].z += nder * ctrl[ span - deg + j ].z;

		}

	}

	return v;

}

/*
 * Compute B-Spline surface point. See The NURBS Book, page 103, algorithm A3.5.
 * degU, degV : degrees of B-Spline surface
 * knotU, knotV : knot vectors
 * ctrl : control points
 * s, t : parametric points
*/
function surfacePoint( n, m, degU, degV, knotU, knotV, ctrl, s, t ) {

	const spanU = findIndexSpan( degU, knotU, n, s );
	const spanV = findIndexSpan( degV, knotV, m, t );
	const ni = basisFuncs( degU, knotU, spanU, s );
	const nj = basisFuncs( degV, knotV, spanV, t );
	const v = new Vector( 0, 0, 0 );

	for ( let j = 0; j <= degV; j ++ ) {

		const index = spanV - degV + j;
		const tmp = new Vector( 0, 0, 0 );
		for ( let i = 0; i <= degU; i ++ ) {

			tmp.x += ni[ i ] * ctrl[ index ][ spanU - degU + i ].x;
			tmp.y += ni[ i ] * ctrl[ index ][ spanU - degU + i ].y;
			tmp.z += ni[ i ] * ctrl[ index ][ spanU - degU + i ].z;

		}

		v.x += nj[ j ] * tmp.x;
		v.y += nj[ j ] * tmp.y;
		v.z += nj[ j ] * tmp.z;

	}

	return v;

}

/*
 * Compute B-Spline surface point and all partial derivatives. See The NURBS Book, page 111, algorithm A3.6.
 * degU, degV : degrees of B-Spline surface
 * knotU, knotV : knot vectors
 * ctrl : control points
 * s, t : parametric points
 * SKL[k][l] : k-order and l-order derivatives in u- and v- direction, respectively.
 */
function surfaceDers( n, m, degU, degV, knotU, knotV, ctrl, s, t, d = 2 ) {

	const du = min( d, degU );
	const dv = min( d, degV );
	const spanU = findIndexSpan( degU, knotU, n, s );
	const spanV = findIndexSpan( degV, knotV, m, t );
	const uders = dersBasisFunc( degU, knotU, spanU, d, s );
	const vders = dersBasisFunc( degV, knotV, spanV, d, t );
	const SKL = Array.from( Array( d + 1 ), () => new Array() );
	const temp = new Array( degV + 1 );

	for ( let k = 0; k <= du; k ++ ) {

		for ( let j = 0; j <= degV; j ++ ) {

			temp[ j ] = new Vector( 0, 0, 0 );

			for ( let i = 0; i <= degU; i ++ ) {

				temp[ j ].x += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].x;
				temp[ j ].y += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].y;
				temp[ j ].z += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].z;

			}

		}

		const dd = min( d - k, dv );

		for ( let j = 0; j <= dd; j ++ ) {

			SKL[ k ][ j ] = new Vector( 0, 0, 0 );

			for ( let i = 0; i <= degV; i ++ ) {

				SKL[ k ][ j ].x += vders[ j ][ i ] * temp[ i ].x;
				SKL[ k ][ j ].y += vders[ j ][ i ] * temp[ i ].y;
				SKL[ k ][ j ].z += vders[ j ][ i ] * temp[ i ].z;

			}

		}

	}

	return SKL;

}

/*
 * Compute the point on a Non Uniform Rational B-Spline curve. See The NURBS Book, page 124, algorithm A4.1.
 * deg : degree
 * knot : knot vector
 * ctrl = (wx, wy, wz, w) : weighted control points in four-dimensional space
 * t : parameteric point
*/
function nurbsCurvePoint( deg, knot, ctrl, t ) {

	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nj = basisFuncs( deg, knot, span, t );
	let x = 0, y = 0, z = 0, w = 0;

	for ( let j = 0; j <= deg; j ++ ) {

		x += nj[ j ] * ctrl[ span - deg + j ].x;
		y += nj[ j ] * ctrl[ span - deg + j ].y;
		z += nj[ j ] * ctrl[ span - deg + j ].z;
		w += nj[ j ] * ctrl[ span - deg + j ].w;

	}

	return new Vector( x / w, y / w, z / w );

}

/*
 * Compute derivatives of a Non Uniform Rational B-Spline curve. See The NURBS Book, page 127, algorithm A4.2.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
 * n : order of the highest derivative to compute (default value is 2)
 */
function nurbsCurveDers( deg, knot, ctrl, t, n = 2 ) {

	const v = [];
	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nders = dersBasisFunc( deg, knot, span, n, t );

	for ( let k = 0; k <= n; k ++ ) {

		v[ k ] = new Vector( 0, 0, 0, 0 );

		for ( let j = 0; j <= deg; j ++ ) {

			const nder = nders[ k ][ j ];
			// Sigma( N' x ctrlpw )
			v[ k ].x += nder * ctrl[ span - deg + j ].x;
			v[ k ].y += nder * ctrl[ span - deg + j ].y;
			v[ k ].z += nder * ctrl[ span - deg + j ].z;
			// Sigma( N' x w )
			v[ k ].w += nder * ctrl[ span - deg + j ].w;

		}

	}

	const w = v[ 0 ].w;

	for ( let k = 0; k <= n; k ++ ) {

		for ( let i = 1; i <= k; i ++ ) {

			const binw = binomial( k, i ) * v[ k ].w;
			v[ k ].x -= binw * v[ k - i ].x;
			v[ k ].y -= binw * v[ k - i ].y;
			v[ k ].z -= binw * v[ k - i ].z;

		}

		v[ k ].x /= w;
		v[ k ].y /= w;
		v[ k ].z /= w;

	}

	const ders = v.map( e => new Vector( e.x, e.y, e.z ) );

	return ders;

}

/*
 * Compute binomial coefficient, k! / ( i! * ( k - i )! )
 */
function binomial( k, i ) {

	let nom = 1;

	for ( let j = 2; j <= k; j ++ ) {

		nom *= j;

	}

	let den = 1;

	for ( let j = 2; j <= i; j ++ ) {

		den *= j;

	}

	for ( let j = 2; j <= k - i; j ++ ) {

		den *= j;

	}

	return nom / den;

}

/*
 * Compute Nurbs surface point. See The NURBS Book, page 134, algorithm A4.3.
 * degU, degV : degrees of Nurbs surface
 * knotU, knotV : knot vectors
 * ctrl : control points
 * s, t : parametric points
 */
function nurbsSurfacePoint( n, m, degU, degV, knotU, knotV, ctrl, s, t ) {

	const spanU = findIndexSpan( degU, knotU, n, s );
	const spanV = findIndexSpan( degV, knotV, m, t );
	const ni = basisFuncs( degU, knotU, spanU, s );
	const nj = basisFuncs( degV, knotV, spanV, t );
	const v = new Vector( 0, 0, 0, 0 );

	for ( let j = 0; j <= degV; j ++ ) {

		const index = spanV - degV + j;
		const tmp = new Vector( 0, 0, 0, 0 );
		for ( let i = 0; i <= degU; i ++ ) {

			tmp.x += ni[ i ] * ctrl[ index ][ spanU - degU + i ].x;
			tmp.y += ni[ i ] * ctrl[ index ][ spanU - degU + i ].y;
			tmp.z += ni[ i ] * ctrl[ index ][ spanU - degU + i ].z;
			tmp.w += ni[ i ] * ctrl[ index ][ spanU - degU + i ].w;

		}

		v.x += nj[ j ] * tmp.x;
		v.y += nj[ j ] * tmp.y;
		v.z += nj[ j ] * tmp.z;
		v.w += nj[ j ] * tmp.w;

	}

	return deWeight( v );

}

/*
 * Compute point and derivatives of Nurbs surface. See The NURBS Book, page 137, algorithm A4.4.
 */
function nurbsSurfaceDers( n, m, degU, degV, knotU, knotV, ctrl, s, t, d = 2 ) {

	const du = min( d, degU );
	const dv = min( d, degV );
	const spanU = findIndexSpan( degU, knotU, n, s );
	const spanV = findIndexSpan( degV, knotV, m, t );
	const uders = dersBasisFunc( degU, knotU, spanU, d, s );
	const vders = dersBasisFunc( degV, knotV, spanV, d, t );
	const Aders = Array.from( Array( d + 1 ), () => new Array() );
	const wders = Array.from( Array( d + 1 ), () => new Array() );
	const temp = new Array( degV + 1 );

	for ( let k = 0; k <= du; k ++ ) {

		for ( let j = 0; j <= degV; j ++ ) {

			temp[ j ] = new Vector( 0, 0, 0, 0 );

			for ( let i = 0; i <= degU; i ++ ) {

				temp[ j ].x += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].x;
				temp[ j ].y += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].y;
				temp[ j ].z += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].z;
				temp[ j ].w += uders[ k ][ i ] * ctrl[ spanV - degV + j ][ spanU - degU + i ].w;

			}

		}

		const dd = min( d - k, dv );

		for ( let j = 0; j <= dd; j ++ ) {

			Aders[ k ][ j ] = new Vector( 0, 0, 0 );
			wders[ k ][ j ] = 0;

			for ( let i = 0; i <= degV; i ++ ) {

				Aders[ k ][ j ].x += vders[ j ][ i ] * temp[ i ].x;
				Aders[ k ][ j ].y += vders[ j ][ i ] * temp[ i ].y;
				Aders[ k ][ j ].z += vders[ j ][ i ] * temp[ i ].z;
				wders[ k ][ j ] += vders[ j ][ i ] * temp[ i ].w;

			}

		}

	}

	const SKL = Array.from( Array( d + 1 ), () => new Array() );

	for ( let k = 0; k <= d; k ++ ) {

		for ( let l = 0; l <= d - k; l ++ ) {

			const v = Aders[ k ][ l ];

			for ( let j = 1; j <= l; j ++ ) {

				v.x -= binomial( l, j ) * wders[ 0 ][ j ] * SKL[ k ][ l - j ].x;
				v.y -= binomial( l, j ) * wders[ 0 ][ j ] * SKL[ k ][ l - j ].y;
				v.z -= binomial( l, j ) * wders[ 0 ][ j ] * SKL[ k ][ l - j ].z;

			}

			for ( let i = 1; i <= k; i ++ ) {

				v.x -= binomial( k, i ) * wders[ i ][ 0 ] * SKL[ k - i ][ l ].x;
				v.y -= binomial( k, i ) * wders[ i ][ 0 ] * SKL[ k - i ][ l ].y;
				v.z -= binomial( k, i ) * wders[ i ][ 0 ] * SKL[ k - i ][ l ].z;

				var v2 = new Vector( 0, 0, 0 );

				for ( let j = 1; j <= l; j ++ ) {

					v2.x += binomial( l, j ) * wders[ i ][ j ] + SKL[ k - i ][ l - j ].x;
					v2.y += binomial( l, j ) * wders[ i ][ j ] + SKL[ k - i ][ l - j ].y;
					v2.z += binomial( l, j ) * wders[ i ][ j ] + SKL[ k - i ][ l - j ].z;

				}

				v.x -= binomial( k, i ) * v2.x;
				v.y -= binomial( k, i ) * v2.y;
				v.z -= binomial( k, i ) * v2.z;

			}

			v.x /= wders[ 0 ][ 0 ];
			v.y /= wders[ 0 ][ 0 ];
			v.z /= wders[ 0 ][ 0 ];

			SKL[ k ][ l ] = v;

		}

	}

	return SKL;

}

function split( deg, knot, ctrl, t ) {

	if ( t <= knot[ 0 ] || t >= knot[ knot.length - 1 ] ) {

		console.warn( "nurbs hasn't been splited" );
		return;

	}

	knotInsert( deg, knot, ctrl, t, deg );

	const span = findIndexSpan( deg, knot, ctrl.length, t );

	const knot1 = knot.slice( 0, span + 1 );
	const ctrl1 = ctrl.slice( 0, span + 1 - deg );
	const knot2 = knot.slice( span );
	const ctrl2 = ctrl.slice( span - deg );

	const nm1 = ctrl.length - 1;
	const k = deg - nm1;

	if ( k > 0 ) {

		for ( let i = 0; i < k; i ++ ) knot1.shift();
		for ( let i = 0; i < nm1; i ++ ) knot2.unshift( knot2[ 0 ] );

	} else {

		knot1.push( knot1[ knot1.length - 1 ] );
		for ( let i = 0; i < deg; i ++ ) knot2.unshift( knot2[ 0 ] );

	}

	return [ knot1, ctrl1, knot2, ctrl2 ];

}

/*
 * Modify control points by knot insertion. See The NURBS Book, page 151, algorithm A5.1.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : knot to be inserted
 * r : r times insertion
*/
function knotInsert( deg, knot, ctrl, t, r = 1 ) {

	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const q = [];
	let s = 0; //initial multiplicity

	while ( abs( knot[ span - s ] - t ) < EPSILON ) {

		s ++;

	}

	while ( r + s > deg ) { //Try not to have multiplicity of interior knot greater than degree

		r --;

	}

	if ( r < 1 ) {

		// console.warn( "knot hasn't been inserted" );
		return;

	}

	for ( let i = 0; i <= deg; i ++ ) {

		q[ i ] = ctrl[ span - deg + i ];

	}

	//const low = span - deg + 1;
	let low;

	for ( let j = 1; j <= r; j ++ ) {

		low = span - deg + j;

		for ( let i = 0; i <= deg - j; i ++ ) {

			const alpha = ( t - knot[ low + i ] ) / ( knot[ span + 1 + i ] - knot[ low + i ] );
			q[ i ] = q[ i + 1 ].mul( alpha ).add( q[ i ].mul( 1.0 - alpha ) );
			i === deg - j ? ctrl.splice( low + i, 0, q[ i ] ) : ctrl[ low + i ] = q[ i ];

		}

	}

	for ( let i = 1; i <= r; i ++ ) {

		knot.splice( span + 1, 0, t );

	}

}

function surfKnotInsert( deg_u, deg_v, knot_u, knot_v, ctrl, s, t ) {

	const ni = knot_u.length - deg_u - 1;

	const nj = knot_v.length - deg_v - 1;

	if ( s !== 0 ) {

		const alpha = [];

		const span = findIndexSpan( deg_u, knot_u, ni, s );

		const low = span - deg_u + 1;

		for ( let i = 0; i < deg_u; i ++ ) {

			alpha[ i ] = ( s - knot_u[ low + i ] ) / ( knot_u[ span + 1 + i ] - knot_u[ low + i ] );

		}

		knot_u.splice( span + 1, 0, s );

		for ( let j = 0; j < nj; j ++ ) {

			calcCtrl( span, low, deg_u, alpha, ctrl[ j ] );

		}

	}

	if ( t !== 0 ) {

		const alpha = [];

		const span = findIndexSpan( deg_v, knot_v, nj, t );

		const low = span - deg_v + 1;

		for ( let i = 0; i < deg_v; i ++ ) {

			alpha[ i ] = ( t - knot_v[ low + i ] ) / ( knot_v[ span + 1 + i ] - knot_v[ low + i ] );

		}

		knot_v.splice( span + 1, 0, t );

		const trans = transpose( ctrl );

		for ( let i = 0; i < ni; i ++ ) {

			calcCtrl( span, low, deg_v, alpha, trans[ i ] );

		}

		ctrl.push( new Array( ni ) );

		for ( let j = 0; j < ctrl.length; j ++ ) {

			const pts = ctrl[ j ];

			for ( let i = 0; i < pts.length; i ++ ) {

				ctrl[ j ][ i ] = trans[ i ][ j ];

			}

		}

	}

	function calcCtrl( span, low, deg, alpha, ctrl ) {

		const q = [];

		for ( let i = 0; i <= deg; i ++ ) {

			const tmp = ctrl[ span - deg + i ];
			q[ i ] = tmp;

		}

		for ( let i = 0; i < deg; i ++ ) {

			q[ i ] = q[ i + 1 ].mul( alpha[ i ] ).add( q[ i ].mul( 1.0 - alpha[ i ] ) );
			i === deg - 1 ? ctrl.splice( low + i, 0, q[ i ] ) : ctrl[ low + i ] = q[ i ];

		}

	}

	function transpose( matrix ) {

		return matrix[ 0 ].map( ( col, i ) => matrix.map( row => row[ i ] ) );

	}

}

/**
 * Knot removal.
 * See The NURBS Book, page 206, algorithm A5.8.
 *
 */
function knotsRemoval( deg, knot, ctrl, u, num = 1, tol = 1e-4 ) {

	const span = findIndexSpan( deg, knot, ctrl.length, u );
	const r = u - knot[ span ] <= knot[ span + 1 ] - u ? span : span + 1;
	const interior = deg < r && r < ctrl.length;

	if ( ! interior ) return;

	let s = 0; // knot multiplicity, 1 ≤ s ≤ degree

	while ( abs( knot[ r - s ] - knot[ r ] ) < EPSILON ) {

		s ++;

	}

	while ( num > s ) { //Try not to remove more than multiplicity of interior knot

		num --;

	}

	// console.log( 'knot multiplicity=', s, 'Number of removal trial =', num );
	const m = ctrl.length + deg;
	const ord = deg + 1;
	const fout = floor( ( 2 * r - s - deg ) / 2 );
	let last = r - s;
	let first = r - deg;
	const temp = [];
	let t; // actual number of times of removal

	for ( t = 0; t < num; t ++ ) { // This loop is Eqs 5.28

		const off = first - 1; // difference in index between tem and P
		temp[ 0 ] = ctrl[ off ];
		temp[ last + 1 - off ] = ctrl[ last + 1 ];
		var i = first;
		var j = last;
		let ii = 1;
		let jj = last - off;
		let remflag = false;

		while ( j - i > t ) { // Compute control points for one removal step

			const alpha_i = ( u - knot[ i ] ) / ( knot[ i + ord + t ] - knot[ i ] );
			const alpha_j = ( u - knot[ j - t ] ) / ( knot[ j + ord ] - knot[ j - t ] );
			temp[ ii ] = ctrl[ i ].sub( temp[ ii - 1 ].mul( 1.0 - alpha_i ) ).mul( 1 / alpha_i );
			temp[ jj ] = ctrl[ j ].sub( temp[ jj + 1 ].mul( alpha_j ) ).mul( 1 / ( 1.0 - alpha_j ) );
			i ++; ii ++; j --; jj --;

		}

		if ( j - i < t ) { // Check if knot removable

			if ( temp[ ii - 1 ].sub( temp[ jj + 1 ] ).length() <= tol ) remflag = true;

		} else {

			const alpha_i = ( u - knot[ i ] ) / ( knot[ i + ord + t ] - knot[ i ] );
			const tmp = temp[ ii + t + 1 ].mul( alpha_i ).add( temp[ ii - 1 ].mul( 1.0 - alpha_i ) );
			if ( ctrl[ i ].sub( tmp ).length() <= tol ) remflag = true;

		}

		if ( ! remflag ) { // cannot remove any more knots

			break;

		} else { // Successful removal. Save new control points.

			let i = first;
			let j = last;
			while ( j - i > t ) {

				ctrl[ i ] = temp[ i - off ];
				ctrl[ j ] = temp[ j - off ];
				i ++;
				j --;

			}

		}

		first --;
		last ++;

	} // End of for-loop

	if ( t === 0 ) return false;

	for ( let k = r + 1; k <= m; k ++ ) {

		knot[ k - t ] = knot[ k ]; // Shift knot

	}

	j = fout;
	i = j; // Pj thru Pi will be overwritten

	for ( let k = 1; k < t; k ++ ) {

		if ( k % 2 === 1 ) {

			i ++;

		} else {

			j --;

		}

	}

	for ( let k = i + 1; k <= ctrl.length - 1; k ++ ) {

		ctrl[ j ] = ctrl[ k ];
		j ++;

	}

	for ( let i = 0; i < t; i ++ ) {

		ctrl.pop();
		knot.pop();

	}

	console.log( 'actual times of removal =', t );
	return true;

}


function binarySearch( arr, target ) {

	let low = 0;
	let high = arr.length - 1;

	while ( low != high ) {

		const m = ceil( ( low + high ) / 2 );

		arr[ m ] > target ? high = m - 1 : low = m;

	}

	if ( arr[ low ] !== target ) console.warn( `target between ${low} and ${low + 1}` );

	return low;

}
/*
function knotsRemoval( deg, knot, ctrl, t ) {

	const tol = 1e-10; //Number.EPSILON;
	const knotmuls = knotMults( knot );

	let low = 0;
	let high = knotmuls.length - 1;

	while ( low != high ) { // binary search

		const m = ceil( ( low + high ) / 2 );

		knotmuls[ m ].knot > t ? high = m - 1 : low = m;

	}

	if ( knotmuls[ low ].knot - t > tol ) {

		return;

	}

	const mul = knotmuls[ low ].mult;
	const span = findIndexSpan( deg, knot, ctrl.length, t );

	knot.splice( span, 1 );

}
*/

// count multiplicities at each knot.
function knotMults( knot ) {

	const mults = [ { knot: knot[ 0 ], mult: 0 } ];
	const EPSILON = Number.EPSILON;
	let e = mults[ 0 ];

	for ( let i = 0; i < knot.length; i ++ ) {

		if ( abs( knot[ i ] - e.knot ) > EPSILON ) {

			e = { knot: knot[ i ], mult: 0 };
			mults.push( e );

		}

		e.mult ++;

	}

	return mults;

}

// Decompose Nurbs curve into Bezier segments. See The NURBS Book, page 173, algorithm A5.6.
function decomposeCurve( deg, knot, ctrl ) {

	const knotmults = knotMults( knot );

	for ( let i = 0; i < knotmults.length; i ++ ) {

		var knotmult = knotmults[ i ];

		if ( knotmult.mult < deg ) {

			for ( let k = 0; k < deg - knotmult.mult; k ++ ) {

				knotInsert( deg, knot, ctrl, knotmult.knot, 1 );

			}

		}

	}

	const v = [];
	let j = 0;

	while ( j < ctrl.length - 1 ) {

		const p = ctrl.slice( j, j + deg + 1 );
		v.push( p );
		j += deg;

	}

	return v;

}

/**
 * Degree elevation of a curve.
 * Decomposing curve into Bezier segments, degree of which is elevated, then remove unnecessary knots.
 * See The NURBS Book, page 206, algorithm A5.9.
 *
 */
function elevateDegree( deg, knot, ctrl, degInc ) {

	//if ( degInc <= 0 ) return [ knot, ctrl ];

	const knots = [];
	const ctrlp = [];
	const ph = deg + degInc;
	const ph2 = floor( ph / 2 );
	const bezalfs = Array.from( Array( deg + 1 + degInc ), () => new Array( deg + 1 ).fill( 0 ) );
	// Compute Bezier degree elevation coefficients
	bezalfs[ 0 ][ 0 ] = 1.0;
	bezalfs[ ph ][ deg ] = 1.0;

	for ( let i = 1; i <= ph2; i ++ ) {

		const inv = 1.0 / binomial( ph, i );
		const mpi = min( deg, i );

		for ( let j = max( 0, i - degInc ); j <= mpi; j ++ ) {

			bezalfs[ i ][ j ] = inv * binomial( deg, j ) * binomial( degInc, i - j );

		}

	}

	for ( let i = ph2 + 1; i <= ph - 1; i ++ ) {

		const mpi = min( deg, i );

		for ( let j = max( 0, i - degInc ); j <= mpi; j ++ ) {

			bezalfs[ i ][ j ] = bezalfs[ ph - i ][ deg - j ];

		}

	}

	//console.log( bezalfs );
	//let mh = ph;
	let kind = ph + 1;
	let r = - 1;
	let a = deg;
	let b = deg + 1;
	let cind = 1;
	let ua = knot[ 0 ];
	ctrlp[ 0 ] = ctrl[ 0 ];

	for ( let i = 0; i <= ph; i ++ ) {

		knots[ i ] = ua;

	}

	const bpts = new Array( deg + 1 );
	// Initialize first Bezier segment
	for ( let i = 0; i <= deg; i ++ ) {

		bpts[ i ] = ctrl[ i ];

	}

	const hasWeight = ctrl[ 0 ].w !== undefined ? true : false;
	const ebpts = new Array( deg + degInc + 1 ).fill( hasWeight ? new Vector( 0, 0, 0, 0 ) : new Vector( 0, 0, 0 ) );
	const Nextbpts = new Array( deg - 1 ).fill( hasWeight ? new Vector( 0, 0, 0, 0 ) : new Vector( 0, 0, 0 ) );
	const m = ctrl.length + deg;

	while ( b < m ) { // big loop thru knot vector

		let i = b;

		while ( b < m && knot[ b ] == knot[ b + 1 ] ) b = b + 1;
		const mul = b - i + 1;
		//mh += mul + degInc;
		const ub = knot[ b ];
		const oldr = r;
		r = deg - mul;
		// Insert knot u(b) r times
		const lbz = oldr > 0 ? parseInt( ( oldr + 2 ) / 2 ) : 1;
		const rbz = r > 0 ? ph - parseInt( ( r + 1 ) / 2 ) : ph;
		// console.log( 'lbz, rbz =', lbz, rbz );
		// console.log( 'i=', i, ' b=', b, ' mul=', mul, ' r=', r );
		if ( r > 0 ) { // Insert knot to get Bezier segment

			const numer = ub - ua;
			const alfs = new Array( deg - 1 );

			for ( let k = deg; k > mul; k -- ) {

				alfs[ k - mul - 1 ] = numer / ( knot[ a + k ] - ua );

			}

			console.log( 'Insert knot to get Bezier segment' );
			for ( let j = 1; j <= r; j ++ ) {

				const save = r - j;
				const s = mul + j;
				for ( let k = deg; k >= s; k -- ) {

					const x = alfs[ k - s ] * bpts[ k ].x + ( 1.0 - alfs[ k - s ] ) * bpts[ k - 1 ].x;
					const y = alfs[ k - s ] * bpts[ k ].y + ( 1.0 - alfs[ k - s ] ) * bpts[ k - 1 ].y;
					const z = alfs[ k - s ] * bpts[ k ].z + ( 1.0 - alfs[ k - s ] ) * bpts[ k - 1 ].z;

					if ( hasWeight ) {

						const w = alfs[ k - s ] * bpts[ k ].w + ( 1.0 - alfs[ k - s ] ) * bpts[ k - 1 ].w;
						bpts[ k ] = new Vector( x, y, z, w );

					} else {

						bpts[ k ] = new Vector( x, y, z );

					}

				}

				console.log( 'bpts, j=', j, 'v=', bpts[ j ].x, bpts[ j ].y, bpts[ j ].z, bpts[ j ].w );
				Nextbpts[ save ] = bpts[ deg ];

			}

		} // end of insert knot

		for ( let i = lbz; i <= ph; i ++ ) { // degree elevate Bazier, only points lbz, ... , ph are used below

			ebpts[ i ] = hasWeight ? new Vector( 0, 0, 0, 0 ) : new Vector( 0, 0, 0 );
			const mpi = min( deg, i );
			for ( let j = max( 0, i - degInc ); j <= mpi; j ++ ) {

				const x = ebpts[ i ].x + bezalfs[ i ][ j ] * bpts[ j ].x;
				const y = ebpts[ i ].y + bezalfs[ i ][ j ] * bpts[ j ].y;
				const z = ebpts[ i ].z + bezalfs[ i ][ j ] * bpts[ j ].z;

				if ( hasWeight ) {

					const w = ebpts[ i ].w + bezalfs[ i ][ j ] * bpts[ j ].w;
					ebpts[ i ] = new Vector( x, y, z, w );

				} else {

					ebpts[ i ] = new Vector( x, y, z );

				}

			}

			// console.log( 'ebpts, i=', i, 'v=', ebpts[ i ].x, ebpts[ i ].y, ebpts[ i ].z, ebpts[ i ].w );

		} // end of degree elevating Bezier

		if ( oldr > 1 ) { // must remove knot u = U[a] oldr times

			let first = kind - 2;
			let last = kind;
			const den = ub - ua;
			const bet = ( ub - knots[ kind - 1 ] ) / den;

			for ( let tr = 1; tr < oldr; tr ++ ) { // knot removal loop

				let i = first;
				let j = last;
				let kj = j - kind + 1;
				while ( j - i > tr ) { // loop and compute the new

					// control points for one removal step
					if ( i < cind ) {

						const alf = ( ub - knots[ i ] ) / ( ua - knots[ i ] );
						const x = alf * ctrlp[ i ].x + ( 1.0 - alf ) * ctrlp[ i - 1 ].x;
						const y = alf * ctrlp[ i ].y + ( 1.0 - alf ) * ctrlp[ i - 1 ].y;
						const z = alf * ctrlp[ i ].z + ( 1.0 - alf ) * ctrlp[ i - 1 ].z;
						if ( hasWeight ) {

							const w = alf * ctrlp[ i ].w + ( 1.0 - alf ) * ctrlp[ i - 1 ].w;
							ctrlp[ i ] = new Vector( x, y, z, w );

						} else {

							ctrlp[ i ] = new Vector( x, y, z );

						}

						console.log( 'ctrlp, i=', i, 'v=', ctrlp[ i ].x, ctrlp[ i ].y, ctrlp[ i ].z );

					}

					if ( j >= lbz ) {

						if ( j - tr <= kind - ph + oldr ) {

							const gam = ( ub - knots[ j - tr ] ) / den;
							const x = gam * ebpts[ kj ].x + ( 1.0 - gam ) * ebpts[ kj + 1 ].x;
							const y = gam * ebpts[ kj ].y + ( 1.0 - gam ) * ebpts[ kj + 1 ].y;
							const z = gam * ebpts[ kj ].z + ( 1.0 - gam ) * ebpts[ kj + 1 ].z;
							if ( hasWeight ) {

								const w = gam * ebpts[ kj ].w + ( 1.0 - gam ) * ebpts[ kj + 1 ].w;
								ebpts[ kj ] = new Vector( x, y, z, w );

							} else {

								ebpts[ kj ] = new Vector( x, y, z );

							}

						} else {

							const x = bet * ebpts[ kj ].x + ( 1.0 - bet ) * ebpts[ kj + 1 ].x;
							const y = bet * ebpts[ kj ].y + ( 1.0 - bet ) * ebpts[ kj + 1 ].y;
							const z = bet * ebpts[ kj ].z + ( 1.0 - bet ) * ebpts[ kj + 1 ].z;
							if ( hasWeight ) {

								const w = bet * ebpts[ kj ].w + ( 1.0 - bet ) * ebpts[ kj + 1 ].w;
								ebpts[ kj ] = new Vector( x, y, z, w );

							} else {

								ebpts[ kj ] = new Vector( x, y, z );

							}

						}

					}

					i ++;
					j --;
					kj --;

				}

				first --;
				last ++;

			}

		} // end of removing knot, u = U[a]

		if ( a != deg ) { // loop the knot ua

			for ( let i = 0; i < ph - oldr; i ++ ) {

				knots[ kind ] = ua;
				kind ++;

			}

		}

		for ( let j = lbz; j <= rbz; j ++ ) { // load ctrl into ctrlp

			ctrlp[ cind ] = ebpts[ j ];
			cind ++;

		}

		if ( b < m ) { // set up for next pass thru loop

			for ( let j = 0; j < r; j ++ ) bpts[ j ] = Nextbpts[ j ];

			for ( let j = r; j <= deg; j ++ ) bpts[ j ] = ctrl[ b - deg + j ];

			a = b;
			b = b + 1;
			ua = ub;

		} else { // end knot

			for ( let i = 0; i <= ph; i ++ ) knots[ kind + i ] = ub;

		}

	} // end of big while loop

	//nh = mh - ph - 1;
	return [ knots, ctrlp ];

}

function reverseDirection( knots, ctrlp ) { // inpur array will be changed

	const nm1 = knots.length - 1;
	const tmin = knots[ 0 ];
	const tmax = knots[ nm1 ];
	const t = knots.slice();

	for ( let i = 0; i <= nm1; i ++ ) {

		knots[ nm1 - i ] = tmax + tmin - t[ i ];

	}

	ctrlp.reverse();

}

/*
 * Create arbitrary Nurbs circular arc. See The NURBS Book, page 308, algorithm A7.1.
 * o : origin of local coordinates
 * x : unit length vector in the reference plane of the circle
 * y : unit length vector in the ref. plane, and orthogonal to x
 * a0, a1 : start and end angles in relative to horizontal coordinate of x
 */
function makeNurbsCircle( o, x, y, r, a0, a1 ) {

	//a1 < a0 ? a1 = 2.0 * PI + a1 : null;
	const theta = a1 - a0;
	let narcs;

	if ( theta <= 0.5 * PI ) {

		narcs = 1;

	} else if ( theta <= PI ) {

		narcs = 2;

	} else if ( theta <= 1.5 * PI ) {

		narcs = 3;

	} else {

		narcs = 4;

	}

	const dtheta = theta / narcs;
	const w1 = cos( 0.5 * dtheta ); // 0.5 * dtheta is base angle
	let p0 = o.add( x.mul( r * cos( a0 ) ) ).add( y.mul( r * sin( a0 ) ) );
	let t0 = y.mul( cos( a0 ) ).sub( x.mul( sin( a0 ) ) ); // Initialize start values
	const pw = [];
	pw[ 0 ] = new Vector( p0.x, p0.y, p0.z, 1.0 );
	let index = 0;
	let angle = a0;

	for ( let i = 1; i <= narcs; i ++ ) {

		angle += dtheta;
		const p2 = o.add( x.mul( r * cos( angle ) ) ).add( y.mul( r * sin( angle ) ) );
		pw[ index + 2 ] = new Vector( p2.x, p2.y, p2.z, 1.0 );
		const t2 = y.mul( cos( angle ) ).sub( x.mul( sin( angle ) ) );
		const p1 = intersect3DLines( p0, t0, p2, t2 );
		pw[ index + 1 ] = new Vector( w1 * p1.x, w1 * p1.y, w1 * p1.z, w1 );
		index += 2;
		p0 = new Vector( p2.x, p2.y, p2.z );
		t0 = new Vector( t2.x, t2.y, t2.z );

	}

	let j = 2 * narcs + 1;
	const knot = [];

	for ( let i = 0; i < 3; i ++ ) {

		knot[ i ] = 0.0;
		knot[ i + j ] = 1.0;

	}

	switch ( narcs ) {

		case 1:
			break;

		case 2:
			knot[ 3 ] = knot[ 4 ] = 0.5;
			break;

		case 3:
			knot[ 3 ] = knot[ 4 ] = 1.0 / 3.0;
			knot[ 5 ] = knot[ 6 ] = 2.0 / 3.0;
			break;

		case 4:
			knot[ 3 ] = knot[ 4 ] = 0.25;
			knot[ 5 ] = knot[ 6 ] = 0.5;
			knot[ 7 ] = knot[ 8 ] = 0.75;
			break;

	}

	return [ knot, pw ];

}

/*
 * Check intersection of two 3D lines
 * p0, p1 : start point
 * d1, d2 : direction of parametric representations of the line
 * C(t) = p0 + d0 x s
 * C(s) = p1 + d1 x t
 * where 0 ≤ t, s ≤ 1
 */
function intersect3DLines( p0, d0, p1, d1 ) {

	const a = array( [[ d0.x, - d1.x ], [ d0.y, - d1.y ]] );
	const b = array( [[ p1.x - p0.x ], [ p1.y - p0.y ]] );
	const x = a.solve( b );

	const c1 = p0.z + d0.z * x.data[ 0 ];
	const c2 = p1.z + d1.z * x.data[ 1 ];

	if ( c1 - c2 < 1e-9 ) {

		//const res = p0.add( d0.mul( x.data[ 0 ] ) );
		const res = p1.add( d1.mul( x.data[ 1 ] ) );
		return res;

	} else {

		console.warn( 'no intersection from intersect3DLines()' );
		return p1;

	}

}

/*
 * Global interpolation through points. See The NURBS Book, page 369, algorithm A9.1.
 * deg : degree
 * prm : parameterized values at each point
 * knot : knot vector
 * pts : to store points having slope constraints(optional)
 */
function globalCurveInterp( deg, prm, knot, pts ) {

	const n = pts.length;
	var arr = [];

	for ( let i = 0; i < n; i ++ ) {

		const span = findIndexSpan( deg, knot, n, prm[ i ] );
		const nj = basisFuncs( deg, knot, span, prm[ i ] );
		arr[ i ] = new Array( n ).fill( 0.0 );

		for ( let j = 0; j <= deg; j ++ ) {

			arr[ i ][ span - deg + j ] = nj[ j ];

		}

	}

	return solve( arr, pts );

}


/**
 * Determine control points of curve interpolation with directional constraints. See Piegl et al (2008).
 * deg : degree
 * prm : parameterized values at each point
 * knot : knot vector
 * pole : to store points having slope constraints(tangent vector, optional)
 */
function globalCurveInterpTngt( deg, prm, knot, pole ) {

	const n = pole.length;
	const point = pole.map( e => e.point );
	const slope = pole.map( e => e.slope ).filter( Boolean );
	var arr = [];

	if ( ! slope.length ) { // no directional constraint

		for ( let i = 0; i < n; i ++ ) {

			const span = findIndexSpan( deg, knot, n, prm[ i ] );
			const nj = basisFuncs( deg, knot, span, prm[ i ] );
			arr[ i ] = new Array( n ).fill( 0.0 );

			for ( let j = 0; j <= deg; j ++ ) {

				arr[ i ][ span - deg + j ] = nj[ j ];

			}

		}

		return solve( arr, point );

	} else { // if directional constraint(s) exist

		const nCtrlp = n + slope.length;
		const b = new Array( nCtrlp ).fill( new Vector( 0, 0, 0 ) );
		var m = 0;

		for ( let i = 0; i < n; i ++ ) {

			const span = findIndexSpan( deg, knot, nCtrlp, prm[ i ] );
			const nj = basisFuncs( deg, knot, span, prm[ i ] );
			arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );

			for ( let j = 0; j <= deg; j ++ ) {

				arr[ i + m ][ span - deg + j ] = nj[ j ];

			}

			b[ i + m ] = point[ i ];

			const hasValue = pole[ i ].slope ? true : false;

			if ( hasValue ) { // additional ctrlp for directional constraint

				m ++;
				arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );

				switch ( i ) {

					case 0 :

						arr[ i + m ][ 0 ] = - 1.0;
						arr[ i + m ][ 1 ] = 1.0;
						b[ i + m ] = pole[ i ].slope.mul( ( knot[ deg + 1 ] - knot[ 0 ] ) / deg );
						break;

					case n - 1 : // end derivatives

						arr[ i + m ][ nCtrlp - 2 ] = - 1.0;
						arr[ i + m ][ nCtrlp - 1 ] = 1.0;
						b[ i + m ] = pole[ i ].slope.mul( ( knot[ nCtrlp + deg ] - knot[ nCtrlp - 1 ] ) / deg );
						break;

					default : // additional interior knots needed for other derivative constraints

						const span = findIndexSpan( deg, knot, nCtrlp, prm[ i ] );
						const nder = dersBasisFunc( deg, knot, span, 1, prm[ i ] );

						for ( let j = 0; j <= deg; j ++ ) {

							arr[ i + m ][ span - deg + j ] = nder[ 1 ][ j ]; // set the first derivative

						}

						b[ i + m ] = pole[ i ].slope; // to be equal with directional constraint

				}

			}

		}

		return solve( arr, b );

	}

}

/*
 * Solve linear equations of Ax = b, where the solutions for each component of Vector3 are needed.
 */
function solve( a, pts ) {

	const n = pts.length;
	var x = [];
	var y = [];
	var z = [];

	for ( let i = 0; i < n; i ++ ) {

		x[ i ] = pts[ i ].x;
		y[ i ] = pts[ i ].y;
		z[ i ] = pts[ i ].z;

	}

	// solve Ax = b
	x = array( a ).solve( array( x ).reshape( n, 1 ) ).data;
	y = array( a ).solve( array( y ).reshape( n, 1 ) ).data;
	z = array( a ).solve( array( z ).reshape( n, 1 ) ).data;

	const v = [];

	for ( let i = 0; i < n; i ++ ) {

		v[ i ] = new Vector( x[ i ], y[ i ], z[ i ] );

	}

	return v;

}

/*
 * Compute weighted control points to make use of (four-dimensional) homogeneous coordinates representing nonrational form.
 */
function weightedCtrlp( v3, weight ) {

	const isArray = Array.isArray( v3 );

	if ( isArray ) {

		const v4 = [];

		for ( let i = 0; i < v3.length; i ++ ) {

			const w = weight[ i ];
			const wx = w * v3[ i ].x;
			const wy = w * v3[ i ].y;
			const wz = w * v3[ i ].z;
			v4.push( new Vector( wx, wy, wz, w ) );

		}

		return v4;

	} else {

		const w = weight;
		const wx = w * v3.x;
		const wy = w * v3.y;
		const wz = w * v3.z;

		return new Vector( wx, wy, wz, w );

	}

}

function deWeight( v4 ) {

	const isArray = Array.isArray( v4 );

	if ( isArray ) {

		const v3 = [];

		for ( let i = 0; i < v4.length; i ++ ) {

			const w = v4[ i ].w;
			const x = v4[ i ].x / w;
			const y = v4[ i ].y / w;
			const z = v4[ i ].z / w;
			v3.push( new Vector( x, y, z ) );

		}

		return v3;

	} else {

		const w = v4.w;
		const x = v4.x / w;
		const y = v4.y / w;
		const z = v4.z / w;

		return new Vector( x, y, z );

	}

}

class Vector {

	constructor( ...components ) {

		this.components = components;

	}

	get x() {

		return this.components[ 0 ];

	}

	get y() {

		return this.components[ 1 ];

	}

	get z() {

		return this.components[ 2 ];

	}

	get w() {

		return this.components[ 3 ];

	}

	set x( v ) {

		this.components[ 0 ] = v;

	}

	set y( v ) {

		this.components[ 1 ] = v;

	}

	set z( v ) {

		this.components[ 2 ] = v;

	}

	set w( v ) {

		this.components[ 3 ] = v;

	}

	add( { components } ) {

		return new Vector( ...components.map( ( e, i ) => this.components[ i ] + e ) );

	}

	sub( { components } ) {

		return new Vector( ...components.map( ( e, i ) => this.components[ i ] - e ) );

	}

	mul( scalr ) {

		return new Vector( ...this.components.map( e => e * scalr ) );

	}

	dot( { components } ) {

		return components.reduce( ( acc, e, i ) => acc + e * this.components[ i ], 0 );

	}

	cross( { components } ) {

		if ( this.components.length !== 3 || components.length !== 3 ) {

			console.warn( 'assumed to have three components for cross product' );

		}

		return new Vector(

			this.components[ 1 ] * components[ 2 ] - this.components[ 2 ] * components[ 1 ],
			this.components[ 2 ] * components[ 0 ] - this.components[ 0 ] * components[ 2 ],
			this.components[ 0 ] * components[ 1 ] - this.components[ 1 ] * components[ 0 ]

		);

	}

	length() {

		return Math.hypot( ...this.components );

	}

	normalize() {

		const length = this.length() || 1; // avoid dividing by zero
		return this.mul( 1 / length );

	}

	negate() {

		return this.mul( - 1 );

	}

}

class VectorA extends Float32Array { // cannot overload length()

	constructor( ...components ) {

		super( components.length );
		components.map( ( e, i ) => this[ i ] = e );

	}

}

class Quaternion {

	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

	}

	setFromAxisAngle( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		const s = sin( 0.5 * angle );

		this.x = axis.x * s;
		this.y = axis.y * s;
		this.z = axis.z * s;
		this.w = cos( 0.5 * angle );

		//this._onChangeCallback();

		return this;

	}

}

export { parameterize, assignKnot, deBoorKnots, deBoorKnots2 };
export { deCasteljau1, dersBezier, elevateDegreeBezier };
export { curvePoint, curveDers, surfacePoint, surfaceDers };
export { nurbsCurvePoint, nurbsCurveDers, nurbsSurfacePoint, nurbsSurfaceDers, makeNurbsCircle };
export { knotInsert, surfKnotInsert, knotMults, knotsRemoval, decomposeCurve, elevateDegree };
export { reverseDirection, split, intersect3DLines };
export { globalCurveInterp, globalCurveInterpTngt };
export { Vector, Quaternion, weightedCtrlp, deWeight, calcGreville };
