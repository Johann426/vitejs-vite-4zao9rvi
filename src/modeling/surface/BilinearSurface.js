import { NurbsSurface } from './NurbsSurface.js';

class BilinearSurface extends NurbsSurface {

	constructor( p00, p01, p10, p11 ) {

		super();

		this.pole = [];

		for ( let i = 0; i < arguments.length; i ++ ) {

			this.pole.push( { point: arguments[ i ] } );

		}

		if ( arguments.length === 4 ) this.initialize();

	}

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	get p00() {

		return this.pole[ 0 ].point;

	}

	get p01() {

		return this.pole[ 1 ].point;

	}

	get p10() {

		return this.pole[ 2 ].point;

	}

	get p11() {

		return this.pole[ 3 ].point;

	}

	initialize() {

		const deg = 1;

		const knot = [ 0.0, 0.0, 1.0, 1.0 ];

		const ctrlp = [[ this.p00, this.p01 ], [ this.p10, this.p11 ]];

		super.initialize( deg, deg, knot, knot, ctrlp );

	}

	add( v ) {

		if ( this.pole.length < 4 ) {

			this.pole.push( { point: v } );
			this.needsUpdate = true;

		}

	}

	mod( i, v ) {

		this.pole[ i ].point = v;
		this.needsUpdate = true;

	}

	getPointAt( s, t ) {

		if ( this.needsUpdate ) {

			this.initialize();
			this.needsUpdate = false;

		}

		return super.getPointAt( s, t );

	}

}

export { BilinearSurface };
