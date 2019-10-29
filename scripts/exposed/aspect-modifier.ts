import OriginalAspectModifier from "../aspect-modifier";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
const AspectModifier = ProxyGenerator.makeImmutableClass(OriginalAspectModifier);
export default AspectModifier;
