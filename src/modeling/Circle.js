import { Vector, weightedCtrlp, deWeight, split } from './NurbsLib.js';
import { Arc } from './Arc.js';
import { Nurbs } from './Nurbs.js';
import { NurbsCurve } from './NurbsCurve.js';

class Circle extends Nurbs {

	constructor( pole ) {

		super( 2 );
		this.type = 'circle';

		if ( pole !== undefined ) {

			this.pole = pole;
			this._calcCtrlPoints( this.r );

		} else {

			this.pole = [];

		}

	}

	// center point
	get p0() {

		return this.pole[ 0 ].point;

	}

	// start point (and radius)
	get p1() {

		return this.pole[ 1 ].point;

	}

	// arbitrary point on a circle to determine normal
	get p2() {

		return this.pole[ 2 ].point;

	}

	get r() {

		const v = this.p1.sub( this.p0 );
		return v.length();

	}

	get normal() {

		return this.p1.sub( this.p0 ).cross( this.p2.sub( this.p1 ) );

	}

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	add( v ) {

		if ( this.pole.length < 3 ) {

			this.pole.push( { point: new Vector( v.x, v.y, v.z ) } );
			this.needsUpdate = true;

		}

	}

	remove( i ) {

		const removed = this.pole.splice( i, 1 );
		this.needsUpdate = true;
		return removed[ 0 ].point;

	}

	mod( i, v ) {

		v = new Vector( v.x, v.y, v.z );

		switch ( i ) {

			case 0 :

				const tmp = v.sub( this.p0 );
				this.pole.map( e => e.point = e.point.add( tmp ) );
				break;

			case 1 :
				this.pole[ 1 ].point = new Vector( v.x, v.y, v.z );

				if ( this.pole.length == 3 ) {

					this.pole[ 2 ].point = this.p2.sub( this.p0 ).normalize().mul( this.r ).add( this.p0 );

				}

				break;

			case 2 :
				this.pole[ 2 ].point = v.sub( this.p0 ).normalize().mul( this.r ).add( this.p0 );
				break;

		}

		this.needsUpdate = true;

	}

	getPointAt( t ) {

		if ( this.needsUpdate ) {

			const n = this.pole.length;

			if ( n == 3 ) {

				this._calcCtrlPoints();

			} else {

				this.ctrlpw = this.pole.map( e => weightedCtrlp( e.point, 1.0 ) );

				for ( let i = 0; i <= this.deg; i ++ ) {

					this.knots[ i ] = 0.0;
					this.knots[ i + n ] = 1.0;

				}

			}

		}

		return super.getPointAt( t );

	}

	_calcCtrlPoints() {

		[ this.knots, this.ctrlpw ] = Arc.getArc( this.p0, this.p1, this.p2, 2 * Math.PI );
		this.needsUpdate = false;

	}

	// nine-point square control polygon
	ninePtsSquare( r ) {

		const ctrlp = [];
		ctrlp[ 0 ] = new Vector( 1.0, 0.0, 0.0 );
		ctrlp[ 1 ] = new Vector( 1.0, 1.0, 0.0 );
		ctrlp[ 2 ] = new Vector( 0.0, 1.0, 0.0 );
		ctrlp[ 3 ] = new Vector( - 1.0, 1.0, 0.0 );
		ctrlp[ 4 ] = new Vector( - 1.0, 0.0, 0.0 );
		ctrlp[ 5 ] = new Vector( - 1.0, - 1.0, 0.0 );
		ctrlp[ 6 ] = new Vector( 0.0, - 1.0, 0.0 );
		ctrlp[ 7 ] = new Vector( 1.0, - 1.0, 0.0 );
		ctrlp[ 8 ] = new Vector( 1.0, 0.0, 0.0 );
		ctrlp.map( e => {

			e.x = e.x * r + this.p0.x;
			e.y = e.y * r + this.p0.y;
			e.z = e.z * r + this.p0.z;

		} );
		const w1 = 0.5 * Math.sqrt( 2.0 );
		const weight = [ 1.0, w1, 1.0, w1, 1.0, w1, 1.0, w1, 1.0 ];
		this.knots = [ 0.0, 0.0, 0.0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1.0, 1.0, 1.0 ];
		this.ctrlpw = weightedCtrlp( ctrlp, weight );

	}

	// seven-point triangular control polygon
	sevenPtsTriangle( r ) {

		const ctrlp = [];
		const a = 0.5 * Math.sqrt( 3.0 );
		ctrlp[ 0 ] = new Vector( a, 0.5, 0.0 );
		ctrlp[ 1 ] = new Vector( 0.0, 2.0, 0.0 );
		ctrlp[ 2 ] = new Vector( - a, 0.5, 0.0 );
		ctrlp[ 3 ] = new Vector( - 2.0 * a, - 1.0, 0.0 );
		ctrlp[ 4 ] = new Vector( 0.0, - 1.0, 0.0 );
		ctrlp[ 5 ] = new Vector( 2.0 * a, - 1.0, 0.0 );
		ctrlp[ 6 ] = new Vector( a, 0.5, 0.0 );
		ctrlp.map( e => e.mul( r ).add( this.p0 ) );
		const weight = [ 1, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0 ];
		const one3rd = 1.0 / 3.0, two3rd = 2.0 / 3.0;
		this.knots = [ 0.0, 0.0, 0.0, one3rd, one3rd, two3rd, two3rd, 1.0, 1.0, 1.0 ];
		this.ctrlpw = weightedCtrlp( ctrlp, weight );

	}

	// seven-point square control polygon
	sevenPtsSquare( r ) {

		const ctrlp = [];
		ctrlp[ 0 ] = new Vector( 1.0, 0.0, 0.0 );
		ctrlp[ 1 ] = new Vector( 1.0, 1.0, 0.0 );
		ctrlp[ 2 ] = new Vector( - 1.0, 1.0, 0.0 );
		ctrlp[ 3 ] = new Vector( - 1.0, 0.0, 0.0 );
		ctrlp[ 4 ] = new Vector( - 1.0, - 1.0, 0.0 );
		ctrlp[ 5 ] = new Vector( 1.0, - 1.0, 0.0 );
		ctrlp[ 6 ] = new Vector( 1.0, 0.0, 0.0 );
		ctrlp.map( e => e.mul( r ).add( this.p0 ) );
		const weight = [ 1, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0 ];
		this.knots = [ 0.0, 0.0, 0.0, 0.25, 0.5, 0.5, 0.75, 1.0, 1.0, 1.0 ];
		this.ctrlpw = weightedCtrlp( ctrlp, weight );

	}

	// seven-point square control polygon
	sevenPtsSquareDeg3( r ) {

		//degree = 3;
		const ctrlp = [];
		ctrlp[ 0 ] = new Vector( 1.0, 0.0, 0.0 );
		ctrlp[ 1 ] = new Vector( 1.0, 2.0, 0.0 );
		ctrlp[ 2 ] = new Vector( - 1.0, 2.0, 0.0 );
		ctrlp[ 3 ] = new Vector( - 1.0, 0.0, 0.0 );
		ctrlp[ 4 ] = new Vector( - 1.0, - 2.0, 0.0 );
		ctrlp[ 5 ] = new Vector( 1.0, - 2.0, 0.0 );
		ctrlp[ 6 ] = new Vector( 1.0, 0.0, 0.0 );
		ctrlp.map( e => e.mul( r ).add( this.p0 ) );
		const w1 = 1.0 / 3.0;
		const weight = [ 1, w1, w1, 1.0, w1, w1, 1.0 ];
		this.knots = [ 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 1.0, 1.0, 1.0 ];
		this.ctrlpw = weightedCtrlp( ctrlp, weight );

	}

	split( t ) {

		const tiny = 1e-9;
		const min = this.knots[ 0 ] + tiny;
		const max = this.knots[ this.knots.length - 1 ] - tiny;
		if ( t > min && t < max ) {

			const arr = split( this.deg, this.knots, this.ctrlpw, t );
			const c0 = new NurbsCurve( this.deg, arr[ 0 ], deWeight( arr[ 1 ] ), arr[ 1 ].map( e => e.w ) );
			const c1 = new NurbsCurve( this.deg, arr[ 2 ], deWeight( arr[ 3 ] ), arr[ 3 ].map( e => e.w ) );
			return [ c0, c1 ];

		}

	}

	clone() {

		return new this.constructor( this.pole.slice() );

	}

	toJSON() {

		const data = {
			metadata: {
				version: 1.0,
				type: this.constructor.name,
				generator: this.constructor.name + '.toJSON'
			}
		};

		data.pole = this.pole;

		return data;

	}

	static fromJSON( data ) {

		const pole = data.pole;
		pole.map( e => e.point = new Vector( ...e.point.components ) );
		return new Circle( pole );

	}

}

export { Circle };
