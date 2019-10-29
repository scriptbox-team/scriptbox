import OriginalAspectSetModifier from "../aspect-set-modifier";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
const AspectSetModifier = ProxyGenerator.makeImmutableClass(OriginalAspectSetModifier);
export default AspectSetModifier;
