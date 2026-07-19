package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/MicahParks/jwkset"
	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

const testKID = "test-key"

// jwksTestServer serves a JWKS document for the given ECDSA public key,
// standing in for Supabase's real /auth/v1/.well-known/jwks.json.
func jwksTestServer(t *testing.T, pub *ecdsa.PublicKey) *httptest.Server {
	t.Helper()

	jwk, err := jwkset.NewJWKFromKey(pub, jwkset.JWKOptions{
		Metadata: jwkset.JWKMetadataOptions{KID: testKID, ALG: jwkset.AlgES256},
	})
	if err != nil {
		t.Fatalf("building JWK: %v", err)
	}
	body, err := json.Marshal(jwkset.JWKSMarshal{Keys: []jwkset.JWKMarshal{jwk.Marshal()}})
	if err != nil {
		t.Fatalf("marshaling JWKS: %v", err)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	}))
	t.Cleanup(srv.Close)
	return srv
}

func jwksVerifier(t *testing.T, srvURL string) *Verifier {
	t.Helper()
	kf, err := keyfunc.NewDefaultCtx(context.Background(), []string{srvURL})
	if err != nil {
		t.Fatalf("building keyfunc: %v", err)
	}
	return &Verifier{keyfunc: kf.Keyfunc, validMethods: []string{"RS256", "ES256"}}
}

func signES256(t *testing.T, priv *ecdsa.PrivateKey, claims *Claims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	token.Header["kid"] = testKID
	signed, err := token.SignedString(priv)
	if err != nil {
		t.Fatalf("signing token: %v", err)
	}
	return signed
}

func validClaims() *Claims {
	return &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user-123",
			Audience:  jwt.ClaimStrings{"authenticated"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
		Email: "participant@example.com",
	}
}

func TestVerifier_ValidToken(t *testing.T) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	srv := jwksTestServer(t, &priv.PublicKey)
	v := jwksVerifier(t, srv.URL)

	tokenString := signES256(t, priv, validClaims())

	claims, err := v.Verify(tokenString)
	if err != nil {
		t.Fatalf("Verify() error = %v, want nil", err)
	}
	if claims.Subject != "user-123" {
		t.Errorf("Subject = %q, want %q", claims.Subject, "user-123")
	}
	if claims.Email != "participant@example.com" {
		t.Errorf("Email = %q, want %q", claims.Email, "participant@example.com")
	}
}

func TestVerifier_ExpiredToken(t *testing.T) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	srv := jwksTestServer(t, &priv.PublicKey)
	v := jwksVerifier(t, srv.URL)

	claims := validClaims()
	claims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(-time.Hour))
	tokenString := signES256(t, priv, claims)

	if _, err := v.Verify(tokenString); err == nil {
		t.Fatal("Verify() error = nil, want expiry error")
	}
}

func TestVerifier_WrongAudience(t *testing.T) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	srv := jwksTestServer(t, &priv.PublicKey)
	v := jwksVerifier(t, srv.URL)

	claims := validClaims()
	claims.Audience = jwt.ClaimStrings{"anon"}
	tokenString := signES256(t, priv, claims)

	if _, err := v.Verify(tokenString); err == nil {
		t.Fatal("Verify() error = nil, want audience error")
	}
}

func TestVerifier_WrongKey(t *testing.T) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	other, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	// Serve `priv`'s public key, but sign with `other` -- must be rejected.
	srv := jwksTestServer(t, &priv.PublicKey)
	v := jwksVerifier(t, srv.URL)

	tokenString := signES256(t, other, validClaims())

	if _, err := v.Verify(tokenString); err == nil {
		t.Fatal("Verify() error = nil, want signature error")
	}
}

// TestVerifier_AlgorithmConfusion guards against the classic JWT
// vulnerability: a JWKS verifier must reject an HS256 token even if
// someone signs it using the serialized EC public key bytes as an
// HMAC secret -- accepting it would let anyone holding the (public!)
// JWKS forge tokens. validMethods is what closes this off.
func TestVerifier_AlgorithmConfusion(t *testing.T) {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	srv := jwksTestServer(t, &priv.PublicKey)
	v := jwksVerifier(t, srv.URL)

	forged := jwt.NewWithClaims(jwt.SigningMethodHS256, validClaims())
	forged.Header["kid"] = testKID
	pubBytes, _ := priv.PublicKey.ECDH()
	forgedString, err := forged.SignedString(pubBytes.Bytes())
	if err != nil {
		t.Fatalf("signing forged token: %v", err)
	}

	if _, err := v.Verify(forgedString); err == nil {
		t.Fatal("Verify() accepted an HS256 token against a JWKS (ES256-only) verifier")
	}
}

func TestHS256Verifier(t *testing.T) {
	v := NewHS256Verifier("test-shared-secret")

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, validClaims())
	tokenString, err := token.SignedString([]byte("test-shared-secret"))
	if err != nil {
		t.Fatalf("signing token: %v", err)
	}

	claims, err := v.Verify(tokenString)
	if err != nil {
		t.Fatalf("Verify() error = %v, want nil", err)
	}
	if claims.Subject != "user-123" {
		t.Errorf("Subject = %q, want %q", claims.Subject, "user-123")
	}

	wrongSecretToken, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, validClaims()).SignedString([]byte("wrong-secret"))
	if _, err := v.Verify(wrongSecretToken); err == nil {
		t.Fatal("Verify() accepted a token signed with the wrong secret")
	}

	// Same algorithm-confusion guard, other direction: an HS256 verifier
	// must reject an ES256 token even if by coincidence it validates.
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generating key: %v", err)
	}
	esToken := signES256(t, priv, validClaims())
	if _, err := v.Verify(esToken); err == nil {
		t.Fatal("Verify() accepted an ES256 token against an HS256-only verifier")
	}
}
