import { Vector, weightedCtrlp, makeNurbsCircle } from './NurbsLib.js';
import { Nurbs } from './Nurbs.js';

class Arc extends Nurbs {

	constructor( pole, planar_normal ) {

		super( 2 );
		this.type = 'arc';

		if ( pole ) {

			this.pole = pole;
			this._calcCtrlPoints();

		} else {

			this.pole = [];

		}

		planar_normal ? this.planar_normal = new Vector( planar_normal.x, planar_normal.y, planar_normal.z ) : null;

	}

	// center point
	get p0() {

		return this.pole[ 0 ].point;

	}

	// start point (and radius)
	get p1() {

		return this.pole[ 1 ].point;

	}

	// end point
	get p2() {

		return this.pole[ 2 ].point;

	}

	get r1() {

		return this.p1.sub( this.p0 );

	}

	get r2() {

		return this.p2.sub( this.p0 );

	}

	get x() {

		return this.r1.normalize();

	}

	get normal() {

		return this.planar_normal ? this.planar_normal : this.r1.cross( this.p2.sub( this.p1 ) );

	}

	get y() {

		return this.normal.cross( this.r1 ).normalize();

	}

	get theta() {

		const r1 = this.r1;
		const r2 = this.r2;
		return Math.acos( r1.dot( r2 ) / r1.length() / r2.length() );

	}

	get angle() {

		if ( this.planar_normal ) {

			const normal = this.r1.cross( this.p2.sub( this.p1 ) );
			const isFlipped = normal.dot( this.planar_normal ) < 0;
			return isFlipped ? 2.0 * Math.PI - this.theta : this.theta;

		} else {

			return this.theta;

		}

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

					this.pole[ 2 ].point = this.r2.normalize().mul( this.r1.length() ).add( this.p0 );

				}

				break;

			case 2 :
				this.pole[ 2 ].point = v.sub( this.p0 ).normalize().mul( this.r1.length() ).add( this.p0 );
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

		this.dmax = 2;
		const o = this.p0;
		const x = this.x;
		const y = this.y;
		const r = this.r1.length();
		const a = this.angle;
		[ this.knots, this.ctrlpw ] = makeNurbsCircle( o, x, y, r, 0, a ); //Arc.getArc( this.p0, this.p1, this.p2, this.angle );
		this.needsUpdate = false;

	}

	split( t ) {

		const tiny = 1e-9;
		const min = this.knots[ 0 ] + tiny;
		const max = this.knots[ this.knots.length - 1 ] - tiny;
		if ( t > min && t < max ) {

			const v = this.getPointAt( t );

			let p0, p1, p2;

			p0 = new Vector( this.p0.x, this.p0.y, this.p0.z );
			p1 = new Vector( this.p1.x, this.p1.y, this.p1.z );
			p2 = new Vector( v.x, v.y, v.z );
			const c0 = new this.constructor( [ { point: p0 }, { point: p1 }, { point: p2 } ] );

			p0 = new Vector( this.p0.x, this.p0.y, this.p0.z );
			p1 = new Vector( v.x, v.y, v.z );
			p2 = new Vector( this.p2.x, this.p2.y, this.p2.z );
			const c1 = new this.constructor( [ { point: p0 }, { point: p1 }, { point: p2 } ] );

			return [ c0, c1 ];

		}

	}

	static getArc( p0, p1, p2, angle ) { // center, start, end

		const r1 = p1.sub( p0 );
		const r2 = p2.sub( p0 );
		const x = r1.normalize();
		const b = r1.cross( p2.sub( p1 ) );
		const y = b.cross( r1 ).normalize();
		const theta = angle ? angle : Math.acos( r1.dot( r2 ) / ( r1.length() * r2.length() ) );
		return makeNurbsCircle( p0, x, y, r1.length(), 0, theta ); // [ knots, ctrlpw ]

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
		data.normal = this.normal;

		return data;

	}

	static fromJSON( data ) {

		const pole = data.pole;
		pole.map( e => e.point = new Vector( ...e.point.components ) );
		return new Arc( pole, new Vector( ...data.normal.components ) );

	}

}

export { Arc };
