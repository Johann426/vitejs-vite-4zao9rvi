import { curvePoint, curveDers, calcGreville, knotInsert, knotsRemoval } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class Bspline extends Parametric {

	constructor( deg, knots, ctrlp ) {

		super();

		this.initialize( deg, knots, ctrlp );

	}

	get deg() {

		const nm1 = this.ctrlp.length - 1;
		return ( nm1 > this.dmax ? this.dmax : nm1 );

	}

	get ctrlPoints() {

		return this.ctrlp;

	}

	get nodes() {

		return calcGreville( this.deg, this.knots ).map( e => this.getPointAt( e ) );

	}

	initialize( deg, knots, ctrlp ) {

		this.dmax = deg;

		this.knots = knots !== undefined ? knots : [];

		this.ctrlp = ctrlp !== undefined ? ctrlp : [];

	}

	insertKnotAt( t ) {

		if ( t > this.tmin && t < this.tmax ) knotInsert( this.deg, this.knots, this.ctrlp, t, 1 );

	}

	removeKnotAt( t, n = 1, tol = 1e-4 ) {

		knotsRemoval( this.deg, this.knots, this.ctrlp, t, n, tol );

	}

	getPointAt( t ) {

		return curvePoint( this.deg, this.knots, this.ctrlp, t );

	}

	getDerivatives( t, k ) {

		return curveDers( this.deg, this.knots, this.ctrlp, t, k );

	}

}

export { Bspline };
