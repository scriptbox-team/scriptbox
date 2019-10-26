import OriginalEntity from "../entity";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
const Entity = ProxyGenerator.makeImmutableClass(OriginalEntity);
export default Entity;
