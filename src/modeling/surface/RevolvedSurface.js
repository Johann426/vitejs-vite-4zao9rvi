import { NurbsSurface } from './NurbsSurface.js';
import { Arc } from '../Arc.js';
import { Quaternion } from '../NurbsLib.js';

class RevolvedSurface extends NurbsSurface {

	constructor( crv, axis, angle ) {

		const pts = crv.ctrlPoints;
		let deg, knot;

		const ctrlp = [];

		const weights = [];

		for ( let i = 0; i < pts.length; i ++ ) {

			const a = axis.clone().normalize();
			const start = pts[ i ];
			const q = new Quaternion();
			const end = pts[ i ].clone().applyQuaternion( q.setFromAxisAngle( a, angle ) );
			const center = a.multiplyScalar( pts[ i ].dot( a ) );
			const arc = new Arc( undefined, axis );
			arc.add( center );
			arc.add( start );
			arc.add( end );
			//pre-calculate arc
			arc.getPointAt( 0 );
			console.log( arc );

			if ( i === 0 ) {

				deg = arc.deg;
				knot = arc.knots;

			}

			ctrlp.push( arc.ctrlPoints );
			weights.push( arc.weights );

		}

		const deg_u = deg;

		const deg_v = crv.deg;

		const knot_u = knot;

		const knot_v = crv.knots;

		super( deg_u, deg_v, knot_u, knot_v, ctrlp, weights );

	}

}

export { RevolvedSurface };
