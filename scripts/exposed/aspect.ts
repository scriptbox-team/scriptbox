import OriginalAspect from "../aspect";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
const Aspect = ProxyGenerator.makeImmutableClass(OriginalAspect);
export default Aspect;
