import OriginalComponent from "../component";
import ProxyGenerator from "../proxy-generator";

// tslint:disable-next-line: variable-name
export const Component = ProxyGenerator.makeImmutable(OriginalComponent);
