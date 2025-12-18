import secrets

PRIME = 2 ** 256 - 189


def to_num(secret):
    return int(secret, 16)


def num_to_hex(num):
    num = num % PRIME
    hex_str = hex(num)[2:]
    hex_str = hex_str.rstrip("L")

    length = len(hex_str)

    if length <= 32:
        return hex_str.zfill(32)
    else:
        return hex_str.zfill(64)


def polynomial(x, coeffs, p):
    y = 0
    for coeff in reversed(coeffs):
        y = (y * x + coeff) % p
    return y


def split_core(secret_num, threshold, shares, prime):
    if threshold > shares:
        raise ValueError("Eşik değeri (threshold) toplam pay sayısından büyük olamaz.")

    coeffs = [secret_num]

    for _ in range(threshold - 1):
        rand_coeff = 1 + secrets.randbelow(prime - 1)
        coeffs.append(rand_coeff)

    generated_shares = []

    for x in range(1, shares + 1):
        y = polynomial(x, coeffs, prime)
        generated_shares.append((x, y))

    return generated_shares


def extended_gcd(a, b):
    x, y = 0, 1
    lx, ly = 1, 0
    while b != 0:
        q = a // b
        a, b = b, a % b
        lx, x = x, lx - q * x
        ly, y = y, ly - q * y
    return lx


def mod_inverse(k, prime):
    k = k % prime
    result = extended_gcd(k, prime)
    return result % prime


def combine_core(shares_tuple, prime):
    x_coords = [s[0] for s in shares_tuple]
    y_coords = [s[1] for s in shares_tuple]

    if len(x_coords) != len(set(x_coords)):
        raise ValueError("Aynı paydan birden fazla girilmiş. Her payın ID'si benzersiz olmalıdır.")

    secret = 0
    k = len(shares_tuple)

    for j in range(k):
        numerator = 1
        denominator = 1

        for m in range(k):
            if j != m:
                numerator = (numerator * (0 - x_coords[m])) % prime
                denominator = (denominator * (x_coords[j] - x_coords[m])) % prime

        inv_denominator = mod_inverse(denominator, prime)

        lagrange_term = (y_coords[j] * numerator * inv_denominator) % prime

        secret = (secret + lagrange_term) % prime

    return secret