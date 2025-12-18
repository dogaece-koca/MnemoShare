import random

PRIME = 2**256 - 1  

def to_num(secret):
    return int(secret, 16)

def num_to_hex(num):
    if num < 0:
        num = num % PRIME
    hex_str = hex(num)[2:]
    return hex_str.zfill(64)

def polynomial(x, coeffs, p):
    y = coeffs[0]
    for i in range(1, len(coeffs)):
        y = (y + coeffs[i] * (x ** i)) % p
    return y

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
    result = extended_gcd(k, prime)
    return result % prime

def split_core(secret_num, threshold, shares, prime):
    coeffs = [secret_num] + [random.randint(1, prime - 1) for _ in range(threshold - 1)]
    generated_shares = []
    for x in range(1, shares + 1):
        y = polynomial(x, coeffs, prime)
        generated_shares.append((x, y))
    return generated_shares

def combine_core(shares_tuple, prime):
    points = shares_tuple
    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]

    secret = 0
    for j in range(len(points)):
        numerator = 1 
        denominator = 1
        
        for m in range(len(points)):
            if j != m:
                neg_x = (0 - x_coords[m] + prime) % prime
                numerator = (numerator * neg_x) % prime
                diff_x = (x_coords[j] - x_coords[m] + prime) % prime
                denominator = (denominator * diff_x) % prime

        denominator = denominator % prime 

        try:
            inverse = mod_inverse(denominator, prime)
        except:
             raise ValueError("Modüler Ters İşlemi Başarısız: Payda sıfırlandı.")
        
        term1 = (y_coords[j] * numerator) % prime
        lagrange_basis = (term1 * inverse) % prime
        
        secret = (secret + lagrange_basis) % prime
        
    return secret