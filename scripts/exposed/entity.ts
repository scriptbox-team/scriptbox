import OriginalEntity from "../entity";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
export const Entity = ProxyGenerator.makeImmutable(OriginalEntity);
