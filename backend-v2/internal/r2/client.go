// Package r2 is a thin S3-compatible client for Cloudflare R2, a port of
// backend/src/config/r2.ts + weeklyService.ts's uploadAudio.
package r2

import (
	"context"
	"fmt"
	"io"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	s3            *s3.Client
	bucketName    string
	publicURLBase string
}

// Option customizes New beyond its required parameters -- currently only
// used by tests to point the client at a local S3-compatible double
// instead of the real Cloudflare R2 endpoint.
type Option func(*options)

type options struct {
	baseEndpoint string
	pathStyle    bool
}

// WithBaseEndpoint overrides the R2 endpoint derived from accountID --
// test-only, so requests can be aimed at an httptest.Server.
func WithBaseEndpoint(endpoint string, pathStyle bool) Option {
	return func(o *options) {
		o.baseEndpoint = endpoint
		o.pathStyle = pathStyle
	}
}

// New builds an R2 client. Matches r2.ts's leniency: missing credentials
// are logged, not fatal, since (as in the Express app) failures only
// surface when an upload is actually attempted.
func New(ctx context.Context, accountID, accessKeyID, secretKey, bucketName, publicURLBase string, opts ...Option) (*Client, error) {
	if accountID == "" || accessKeyID == "" || secretKey == "" || bucketName == "" {
		log.Println("[R2] CRITICAL: One or more R2 credentials are missing.")
	}

	o := options{baseEndpoint: fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)}
	for _, opt := range opts {
		opt(&o)
	}

	cfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion("auto"),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("loading R2 client config: %w", err)
	}

	s3Client := s3.NewFromConfig(cfg, func(so *s3.Options) {
		so.BaseEndpoint = aws.String(o.baseEndpoint)
		so.UsePathStyle = o.pathStyle
	})

	return &Client{s3: s3Client, bucketName: bucketName, publicURLBase: publicURLBase}, nil
}

// UploadResult mirrors uploadAudio's { fileKey, fileUrl } return shape.
type UploadResult struct {
	FileKey string
	FileURL string
}

// Upload puts body at key with contentType, defaulting to audio/wav to
// match uploadAudio's fallback when the client doesn't send one.
func (c *Client) Upload(ctx context.Context, key string, body io.Reader, contentType string) (UploadResult, error) {
	if contentType == "" {
		contentType = "audio/wav"
	}

	_, err := c.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucketName),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return UploadResult{}, fmt.Errorf("uploading to R2: %w", err)
	}

	return UploadResult{FileKey: key, FileURL: c.publicURLBase + "/" + key}, nil
}
