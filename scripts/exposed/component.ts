import OriginalComponent from "../component";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
const Component = ProxyGenerator.makeImmutableClass(OriginalComponent);
export default Component;
