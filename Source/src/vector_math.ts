type Vector3 = {
	x: number;
	y: number;
	z: number;
};

export type Edge = [Vector3, Vector3];
export type Triangle = [Vector3, Vector3, Vector3];
export type Tetrahedron = [Triangle, Triangle, Triangle, Triangle];

export class Geo3D {
	public static createTetrahedron(edge1: Edge, edge2: Edge): Tetrahedron {
		// Top
		const triangle1: Triangle = [edge1[0], edge1[1], edge2[0]];
		const triangle2: Triangle = [edge2[0], edge1[1], edge2[1]];
		// Bottom
		const triangle3: Triangle = [edge1[1], edge1[0], edge2[1]];
		const triangle4: Triangle = [edge2[1], edge1[0], edge2[0]];
		return [triangle1, triangle2, triangle3, triangle4];
	}
}

export class VectorMath {
	private static toRad = 0.0174533;
	private static toDeg = 57.2957795;
	private static min = Math.min;
	private static max = Math.max;
	private static cos = Math.cos;
	private static sin = Math.sin;
	private static acos = Math.acos;
	private static asin = Math.asin;

	private static getVectorFromVectorOrNumber(vector: Vector3 | number) {
		if (typeof vector === "number") return { x: vector, y: vector, z: vector };
		return vector;
	}

	public static equals(vector1: Vector3, vector2: Vector3) {
		return (
			vector1.x == vector2.x &&
			vector1.y == vector2.y &&
			vector1.z == vector2.z
		);
	}

	public static getFlatViewDirection(rotationDegrees: number, usingRadians: boolean = false) {
		let radians = (!usingRadians ? rotationDegrees * this.toRad : rotationDegrees);
		return {
			x: -this.sin(radians), // East-West
			y: 0,
			z: this.cos(radians)  // North-South
		};
	}

	public static rotateVectorY(vector: Vector3, rotationDegrees: number, usingRadians: boolean = false, clockwiseIsNegative: boolean = true) {
		if (!clockwiseIsNegative) rotationDegrees = -rotationDegrees;
		const radiansY = (!usingRadians ? rotationDegrees * this.toRad : rotationDegrees);

		const { x, y, z } = vector;
		let x2 = x * this.cos(radiansY) + z * this.sin(radiansY);
		let z2 = -x * this.sin(radiansY) + z * this.cos(radiansY);

		return {
			x: x2,
			y: y,
			z: z2
		};
	}

	public static rotateVectorLocalX(vector: Vector3, yRotationDegrees: number, rotationDegrees: number, usingRadians: boolean = false, upwardsIsNegative: boolean = true) {
		if (!upwardsIsNegative) rotationDegrees = -rotationDegrees;
		const radiansX = (!usingRadians ? rotationDegrees * this.toRad : rotationDegrees);
		const radiansY = (!usingRadians ? yRotationDegrees * this.toRad : yRotationDegrees);

		const { x, y, z } = vector;
		const finalRadiansX = this.asin(y) + radiansX;

		const forwardX = -this.sin(radiansY);
		const forwardZ = this.cos(radiansY);

		let x2 = forwardX * this.cos(finalRadiansX);
		let y2 = this.sin(finalRadiansX);
		let z2 = forwardZ * this.cos(finalRadiansX);

		return {
			x: x2,
			y: y2,
			z: z2
		};
	}

	public static magnitude(vector: Vector3): number {
		return Math.hypot(vector.x, vector.y, vector.z);
	}

	static magnitudeSquared(vector: Vector3) {
		const { x, y, z } = vector;
		return (x * x + y * y + z * z);
	}

	public static normalise(vector: Vector3) {
		const magnitude = this.magnitude(vector);
		if (magnitude <= Number.EPSILON) {
			return { x: 0, y: -1, z: 0 }
		}
		return {
			x: vector.x / magnitude,
			y: vector.y / magnitude,
			z: vector.z / magnitude
		};
	}

	/**
	 * 
	 * @param {*} vector1 
	 * @param {*} vector2 
	 * @returns vector1 - vector2
	 */
	public static subtract(vector1: Vector3 | number, vector2: Vector3 | number) {
		vector1 = this.getVectorFromVectorOrNumber(vector1);
		vector2 = this.getVectorFromVectorOrNumber(vector2);
		return {
			x: vector1.x - vector2.x,
			y: vector1.y - vector2.y,
			z: vector1.z - vector2.z
		};
	}

	public static add(vector1: Vector3 | number, vector2: Vector3 | number) {
		vector1 = this.getVectorFromVectorOrNumber(vector1);
		vector2 = this.getVectorFromVectorOrNumber(vector2);
		return {
			x: vector1.x + vector2.x,
			y: vector1.y + vector2.y,
			z: vector1.z + vector2.z
		};
	}

	public static multiply(vector: Vector3, scalar: number) {
		return {
			x: vector.x * scalar,
			y: vector.y * scalar,
			z: vector.z * scalar
		};
	}

	public static distanceSquared(vector1: Vector3, vector2: Vector3): number {
		const difference = this.subtract(vector1, vector2);
		return (
			difference.x * difference.x +
			difference.y * difference.y +
			difference.z * difference.z
		);
	}

	public static distance(vector1: Vector3, vector2: Vector3) {
		const difference = this.subtract(vector1, vector2);
		return Math.hypot(difference.x, difference.y, difference.z);
	}

	public static getCenter(vector1: Vector3, vector2: Vector3) {
		const combined = this.add(vector1, vector2);
		return this.multiply(combined, 0.5);
	}

	public static dotProduct(vector1: Vector3, vector2: Vector3) {
		return (vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z);
	}

	public static crossProduct(vector1: Vector3, vector2: Vector3) {
		return {
			x: vector2.y * vector1.z - vector2.z * vector1.y,
			y: vector2.z * vector1.x - vector2.x * vector1.z,
			z: vector2.x * vector1.y - vector2.y * vector1.x
		}
	}

	public static raySphereIntersection(sphereCenter: Vector3, sphereRadius: number, rayOrigin: Vector3, rayDirection: Vector3) {
		// Distances
		const vectorToCenter = this.subtract(sphereCenter, rayOrigin);
		const magnitudeSquared = this.magnitudeSquared(vectorToCenter);
		const sphereRadiusSquared = sphereRadius * sphereRadius;

		// Ray origin is inside the sphere
		if (magnitudeSquared <= sphereRadiusSquared) return true;

		// Project vectorToCenter onto ray (dot product)
		// It is the distance travelled along the ray direction that is closest to the sphere center
		const distanceAlongRayClosestToCenter = this.dotProduct(vectorToCenter, rayDirection);

		// Closest point is behind the ray origin (backwards)
		if (distanceAlongRayClosestToCenter < 0) return false;

		let distanceAlongRayClosestToCenterSquared = distanceAlongRayClosestToCenter * distanceAlongRayClosestToCenter;
		let distanceSquaredDifference = magnitudeSquared - distanceAlongRayClosestToCenterSquared;
		return (distanceSquaredDifference <= sphereRadiusSquared);
	}

	public static rayTriangleIntersection(rayOrigin: Vector3, rayDirection: Vector3, triangle: Triangle): number {
		const v0v1 = this.subtract(triangle[1], triangle[0]);
		const v0v2 = this.subtract(triangle[2], triangle[0]);
		const pvec = this.crossProduct(rayDirection, v0v2);
		const determinant = this.dotProduct(v0v1, pvec);
		// If the determinant is close to 0, the ray misses the triangle because it is parallel
		if (determinant < 1e-6 && determinant > -1e-6) {
			return -1;
		}

		const inverseDeterminant = 1 / determinant;
		const tvec = this.subtract(rayOrigin, triangle[0]);
		const u = this.dotProduct(tvec, pvec) * inverseDeterminant;
		if (u < 0 || u > 1) {
			return -1;
		}

		const qvec = this.crossProduct(tvec, v0v1);
		const v = this.dotProduct(rayDirection, qvec) * inverseDeterminant;
		if (v < 0 || u + v > 1) {
			return -1;
		}

		const t = this.dotProduct(v0v2, qvec) * inverseDeterminant;
		if (t < 0) {
			return -1;
		}
		return t;
	}

	// Credits to ChatGPT for this one :(
	public static capsuleTriangleIntersection(
		capsuleStart: Vector3,
		capsuleEnd: Vector3,
		capsuleRadius: number,
		triangle: Triangle
	): boolean {

		// 1. Check if capsule axis segment intersects triangle directly
		const segmentDirection = this.subtract(capsuleEnd, capsuleStart);
		const segmentLength = this.magnitude(segmentDirection);

		if (segmentLength > 0) {
			const normalizedDirection = {
				x: segmentDirection.x / segmentLength,
				y: segmentDirection.y / segmentLength,
				z: segmentDirection.z / segmentLength
			};

			const t = this.rayTriangleIntersection(capsuleStart, normalizedDirection, triangle);

			// Only accept intersection if it lies within the segment
			if (t >= 0 && t <= segmentLength) {
				return true;
			}
		}

		// 2. Check distance between capsule segment and triangle edges
		const triangleEdges: [Vector3, Vector3][] = [
			[triangle[0], triangle[1]],
			[triangle[1], triangle[2]],
			[triangle[2], triangle[0]]
		];

		for (const [edgeStart, edgeEnd] of triangleEdges) {
			const distanceSquared = this.segmentSegmentDistanceSquared(
				capsuleStart,
				capsuleEnd,
				edgeStart,
				edgeEnd
			);

			if (distanceSquared <= capsuleRadius * capsuleRadius) {
				return true;
			}
		}

		// 3. Check distance from capsule segment to triangle face
		const distanceSquaredToTriangle = this.segmentTriangleDistanceSquared(
			capsuleStart,
			capsuleEnd,
			triangle
		);

		if (distanceSquaredToTriangle <= capsuleRadius * capsuleRadius) {
			return true;
		}

		return false;
	}

	private static segmentSegmentDistanceSquared(segment1Start: Vector3, segment1End: Vector3, segment2Start: Vector3, segment2End: Vector3): number {
		const direction1 = this.subtract(segment1End, segment1Start);
		const direction2 = this.subtract(segment2End, segment2Start);
		const r = this.subtract(segment1Start, segment2Start);

		const a = this.dotProduct(direction1, direction1);
		const e = this.dotProduct(direction2, direction2);
		const f = this.dotProduct(direction2, r);

		let s: number;
		let t: number;

		if (a <= 1e-8 && e <= 1e-8) {
			// Both segments degenerate into points
			return this.dotProduct(r, r);
		}

		if (a <= 1e-8) {
			// First segment is a point
			s = 0;
			t = f / e;
			t = Math.max(0, Math.min(1, t));
		} else {
			const c = this.dotProduct(direction1, r);

			if (e <= 1e-8) {
				// Second segment is a point
				t = 0;
				s = Math.max(0, Math.min(1, -c / a));
			} else {
				const b = this.dotProduct(direction1, direction2);
				const denominator = a * e - b * b;

				if (denominator !== 0) {
					s = Math.max(0, Math.min(1, (b * f - c * e) / denominator));
				} else {
					s = 0;
				}

				t = (b * s + f) / e;

				if (t < 0) {
					t = 0;
					s = Math.max(0, Math.min(1, -c / a));
				} else if (t > 1) {
					t = 1;
					s = Math.max(0, Math.min(1, (b - c) / a));
				}
			}
		}

		const closestPoint1 = {
			x: segment1Start.x + direction1.x * s,
			y: segment1Start.y + direction1.y * s,
			z: segment1Start.z + direction1.z * s
		};

		const closestPoint2 = {
			x: segment2Start.x + direction2.x * t,
			y: segment2Start.y + direction2.y * t,
			z: segment2Start.z + direction2.z * t
		};

		const difference = this.subtract(closestPoint1, closestPoint2);
		return this.dotProduct(difference, difference);
	}

	private static segmentTriangleDistanceSquared(segmentStart: Vector3, segmentEnd: Vector3, triangle: Triangle): number {

		// Check distance to triangle edges
		let minDistanceSquared = Infinity;

		const edges: [Vector3, Vector3][] = [
			[triangle[0], triangle[1]],
			[triangle[1], triangle[2]],
			[triangle[2], triangle[0]]
		];

		for (const [edgeStart, edgeEnd] of edges) {
			const distanceSquared = this.segmentSegmentDistanceSquared(
				segmentStart,
				segmentEnd,
				edgeStart,
				edgeEnd
			);

			if (distanceSquared < minDistanceSquared) {
				minDistanceSquared = distanceSquared;
			}
		}

		return minDistanceSquared;
	}
}