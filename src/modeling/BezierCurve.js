import { deCasteljau1, dersBezier, Vector } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class BezierCurve extends Parametric {

	constructor( ctrlp ) {

		super();

		this.ctrlp = ctrlp !== undefined ? ctrlp : [];

	}

	get ctrlPoints() {

		return this.ctrlp;

	}

	get designPoints() {

		return this.ctrlp;

	}

	add( v ) {

		this.ctrlp.push( new Vector( v.x, v.y, v.z ) );

	}

	remove( i ) {

		const removed = this.ctrlp.splice( i, 1 );
		return removed[ 0 ];

	}

	mod( i, v ) {

		this.ctrlp[ i ] = new Vector( v.x, v.y, v.z );

	}

	incert( i, v ) {

		this.ctrlp.splice( i, 0, new Vector( v.x, v.y, v.z ) );

	}

	getPointAt( t ) {

		//return pointOnBezierCurve( this.ctrlp, t );
		return deCasteljau1( this.ctrlp, t );

	}

	getDerivatives( t ) {

		return dersBezier( this.ctrlp, t );

	}

	clone() {

		return new this.constructor( this.ctrlp.slice() );

	}

	toJSON() {

		const data = {
			metadata: {
				version: 1.0,
				type: this.constructor.name,
				generator: this.constructor.name + '.toJSON'
			}
		};

		data.ctrlp = this.ctrlp;

		return data;

	}

	static fromJSON( data ) {

		const ctrlp = data.ctrlp.map( e => new Vector( ...e.components ) );
		return new BezierCurve( ctrlp );

	}

}

export { BezierCurve };
