import { Vector } from './NurbsLib.js';

class Plane {

	constructor( n = new Vector( 0, 0, 1 ), d = - 0 ) { //Hesse normal form, Nx - d = 0

		this.normal = new Vector( n.x, n.y, n.z ).normalize();
		this.scalar = d;

	}

	closestPoint( v ) {

		return new Vector( v.x, v.y, v.z ).add( this.normal.mul( - this.distanceToPoint( v ) ) );

	}

	setFromNormalAndCoplanarPoint( normal, point ) {

		this.normal = new Vector( normal.x, normal.y, normal.z ).normalize();
		this.scalar = - point.dot( normal );

		return this;

	}

	setFromCoplanarPoints( a, b, c ) {

		const normal = c.sub( b ).cross( a.sub( b ) ).normalize();

		this.setFromNormalAndCoplanarPoint( normal, a );

		return this;

	}

	distanceToPoint( point ) {

		return this.normal.dot( point ) + this.scalar;

	}

	distanceToSphere( sphere ) {

		return this.distanceToPoint( sphere.center ) - sphere.radius;

	}

	projectPoint( point ) {

		return this.normal.mul( - this.distanceToPoint( point ) ).add( point );

	}

	mirrorPoint( point ) {

		return point.add( this.normal.mul( - 2.0 * this.distanceToPoint( point ) ) );

	}

}

export { Plane };
