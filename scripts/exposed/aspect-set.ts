import OriginalAspectSet from "../aspect-set";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
const AspectSet = ProxyGenerator.makeImmutableClass(OriginalAspectSet);
export default AspectSet;
