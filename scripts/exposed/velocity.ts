import ProxyGenerator from "../proxy-generator";
import OriginalVelocity from "../velocity";

// tslint:disable-next-line: variable-name
const Velocity = ProxyGenerator.makeImmutableClass(OriginalVelocity);
export default Velocity;
