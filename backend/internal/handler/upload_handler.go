package handler

import (
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/upload"
	"github.com/iv-tunate/PAS/pkg/response"
)

type UploadHandler struct {
	signer *upload.CloudinarySigner
}

func NewUploadHandler(signer *upload.CloudinarySigner) *UploadHandler {
	return &UploadHandler{signer: signer}
}

func (h *UploadHandler) Sign(c echo.Context) error {
	folder := c.QueryParam("folder")
	if folder == "" {
		folder = "uploads"
	}

	allowed := map[string]bool{
		"courses": true, "pastor-photo": true, "hero-video": true,
		"book-covers": true, "books": true,
	}
	if !allowed[folder] {
		return response.BadRequest(c, "invalid_folder", "folder must be one of: courses, pastor-photo, hero-video, book-covers, books", nil)
	}

	signed := h.signer.Sign(folder)
	return response.OK(c, "", signed)
}
