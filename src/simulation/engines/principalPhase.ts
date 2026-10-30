/**
 * Principal value, in [0, 2π), of the free-particle phase φ = kx − ωt.
 *
 * For an electron ω is about 10^16 rad/s, so φ itself does not fit in a double
 * with a fractional part finer than 2π. The ratio uses the CODATA decimals
 * (e = 1.602176634×10^−19 C exactly, ℏ = 1.054571817×10^−34 J·s) and a 50-digit π.
 *
 * Convention: φ(0) = (k x0) mod 2π with x0 = −50 µm (where the picture starts),
 * and φ(t) = [φ(0) + ω t] mod 2π. The export fixture checks φ(0) in double
 * arithmetic and checks that the exported phase advances at a constant rate.
 * It does not reimplement this reducer: ωt at a sample time is not a double.
 */

const PI_10_50 = 314159265358979323846264338327950288419716939937511n;

function bitLength(value: bigint): number {
    let rest = value < 0n ? -value : value;
    if (rest === 0n) return 0;
    let bits = 0;
    while (rest > 0xffffffffn) {
        rest >>= 32n;
        bits += 32;
    }
    return bits + (32 - Math.clz32(Number(rest)));
}

function doubleToRatio(value: number): { n: bigint; d: bigint } {
    if (value === 0) return { n: 0n, d: 1n };
    const sign = value < 0 ? -1n : 1n;
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, Math.abs(value));
    const bits = view.getBigUint64(0);
    const exponent = Number((bits >> 52n) & 0x7ffn);
    const fraction = bits & 0xfffffffffffffn;
    const subnormal = exponent === 0;
    const mantissa = subnormal ? fraction : (1n << 52n) | fraction;
    const power = subnormal ? -1022 - 52 : exponent - 1023 - 52;
    let numerator = sign * mantissa;
    let denominator = 1n;
    if (power >= 0) numerator <<= BigInt(power);
    else denominator <<= BigInt(-power);
    return { n: numerator, d: denominator };
}

function ratioModTwoPi(numerator: bigint, denominator: bigint): number {
    let n = numerator;
    let d = denominator;
    if (d < 0n) {
        n = -n;
        d = -d;
    }
    const twoPiScaled = d * 2n * PI_10_50;
    let remainder = (n * 10n ** 50n) % twoPiScaled;
    if (remainder < 0n) remainder += twoPiScaled;
    const shift = bitLength(twoPiScaled) - 53;
    const fraction =
        shift > 0
            ? Number(remainder >> BigInt(shift)) / Number(twoPiScaled >> BigInt(shift))
            : Number(remainder) / Number(twoPiScaled);
    let phase = fraction * 2 * Math.PI;
    if (phase >= 2 * Math.PI) phase -= 2 * Math.PI;
    if (phase < 0) phase += 2 * Math.PI;
    return phase;
}

/**
 * φ = (mc² in eV) · (e/ℏ) · (v x0 / c + ½ v² t), with `speedOverC` = v/c.
 * `massEvPerC2` is the mass in eV/c² (the UI mass times 10^5).
 */
export function freeParticlePhase(
    massEvPerC2: number,
    speedOverC: number,
    timeSeconds: number,
    initialXMetres: number,
): number {
    const mass = doubleToRatio(massEvPerC2);
    const speed = doubleToRatio(speedOverC);
    const time = doubleToRatio(timeSeconds);
    const x0 = doubleToRatio(initialXMetres);
    const chargeOverHbar = { n: 1602176634n * 10n ** 15n, d: 1054571817n };
    const light = { n: 299792458n, d: 1n };
    const halfSpeedSquaredTime = {
        n: speed.n * speed.n * time.n,
        d: speed.d * speed.d * time.d * 2n,
    };
    const speedPositionOverLight = {
        n: speed.n * x0.n * light.d,
        d: speed.d * x0.d * light.n,
    };
    const inner = {
        n: halfSpeedSquaredTime.n * speedPositionOverLight.d + speedPositionOverLight.n * halfSpeedSquaredTime.d,
        d: halfSpeedSquaredTime.d * speedPositionOverLight.d,
    };
    return ratioModTwoPi(
        mass.n * chargeOverHbar.n * inner.n,
        mass.d * chargeOverHbar.d * inner.d,
    );
}
