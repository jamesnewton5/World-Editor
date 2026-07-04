
export class Schema {
    private _source: CustomType;
    check: (unknownVariable: any) => boolean;

    constructor(reference: CustomType) {
        this._source = reference;
        this.check = (unknownVariable: any) => Schema.validateType(unknownVariable, this);
    }

    static validateType(unknownVariable: any, referenceType: CustomType): boolean {
        if (referenceType instanceof Schema) referenceType = referenceType._source;
        if (typeof referenceType === "string") {
            // Primitive Types
            if (referenceType === "null") return (unknownVariable === null);
            return (typeof unknownVariable === referenceType);
        } else if (Object.hasOwn(referenceType, "arrayOf")) {
            // Arrays
            if (!Array.isArray(unknownVariable)) return false;
            const customType = (referenceType as ArrayType).arrayOf;
            const typeArray = Array.isArray(customType) ? customType : [customType]
            for (const unknownValue of unknownVariable) {
                let typeIsValid = false;
                for (const customType of typeArray) {
                    if (!Schema.validateType(unknownValue, customType)) continue;
                    typeIsValid = true;
                    break;
                }
                if (!typeIsValid) return false;
            }
            return true;
        }
        // referenceType is typeof object:
        if (typeof unknownVariable !== "object" || unknownVariable === null) return false;

        const { types, properties } = referenceType as ObjectType;
        const allowPartial = (properties?.allowPartial !== undefined ? properties.allowPartial : PROPERTY_DEFAULTS.allowPartial);
        const allowExtensions = (properties?.allowExtensions !== undefined ? properties.allowExtensions : PROPERTY_DEFAULTS.allowExtensions);

        const typeSet = new Set(Object.keys(types));
        const unknownSet = new Set(Object.keys(unknownVariable));

        let allPropertiesRequired = !allowPartial;
        let allPropertiesPresent = true;

        for (const typeKey of typeSet) {
            const typeObject = types[typeKey];
            if (!typeObject.require) allPropertiesRequired = false;
            // Object does not contain key: 
            if (!unknownSet.has(typeKey)) {
                allPropertiesPresent = false;
                if (typeObject.require === false || allowPartial) continue;
                return false;
            }

            const propertyType = typeObject.propertyType;
            const unknownValue = unknownVariable[typeKey];
            let typeIsValid = false;

            const propertyTypeArray = Array.isArray(propertyType) ? propertyType : [propertyType];
            for (const propertyType of propertyTypeArray) {
                if (!Schema.validateType(unknownValue, propertyType)) continue;
                typeIsValid = true;
                break;
            }
            if (!typeIsValid) return false;
        }

        // Don't need to verify no extra properties exist:
        if (allowExtensions) return true;

        // All properties already validated, 
        if (allPropertiesRequired || allPropertiesPresent) return (unknownSet.size === typeSet.size);

        // Check for extra properties
        for (const key of unknownSet) {
            if (!typeSet.has(key)) return false;
        }
        return true;
    }
}

type CustomType = "string" | "number" | "boolean" | "undefined" | "null" | "function" | "object" | ObjectType | ArrayType | Schema;
type ObjectPropertyType = {
    require?: boolean,
    propertyType: CustomType | Array<CustomType>
};
type TypeProperties = {
    allowPartial: boolean;
    allowExtensions: boolean;
};
type TypeObject = {
    [key: string]: ObjectPropertyType;
};
type ArrayType = {
    arrayOf: CustomType | Array<CustomType>
};
type ObjectType = {
    properties?: Partial<TypeProperties>,
    types: TypeObject
};
const PROPERTY_DEFAULTS: TypeProperties = {
    allowPartial: false,
    allowExtensions: false
};

