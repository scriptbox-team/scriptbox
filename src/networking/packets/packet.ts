/**
 * A packet sent across the network from the client to the server or vice-versa.
 * Every packet also has its own class-specific method for deserializing.
 *
 * @export
 * @abstract
 * @class Packet
 * @module networking
 */
export default abstract class Packet {
    /**
     * Convert the packet into a data representation which can be sent over the network.
     *
     * @abstract
     * @returns {object} The data to be sent across the network.
     * @memberof Packet
     */
    public abstract serialize(): object;
}
