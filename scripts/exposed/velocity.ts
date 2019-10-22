import ProxyGenerator from "../proxy-generator";
import OriginalVelocity from "../velocity";

// tslint:disable-next-line: variable-name
const Velocity = ProxyGenerator.makeImmutable(OriginalVelocity);
export default Velocity;
