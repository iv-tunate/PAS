package handler

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
	"github.com/iv-tunate/PAS/pkg/validate"
)

type BookHandler struct {
	books *service.BookService
}

func NewBookHandler(books *service.BookService) *BookHandler {
	return &BookHandler{books: books}
}

func (h *BookHandler) List(c echo.Context) error {
	books, err := h.books.ListPublished(c.Request().Context())
	if err != nil {
		return response.Internal(c, "could not load books")
	}
	return response.OK(c, "", books)
}

func (h *BookHandler) AdminList(c echo.Context) error {
	books, err := h.books.ListAllForAdmin(c.Request().Context())
	if err != nil {
		return response.Internal(c, "could not load books")
	}
	return response.OK(c, "", books)
}

type bookRequest struct {
	Title         string `json:"title"`
	Author        string `json:"author"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
	FileURL       string `json:"file_url"`
	PriceKobo     int64  `json:"price_kobo"`
	PriceUSDCents int64  `json:"price_usd_cents"`
	IsPublished   bool   `json:"is_published"`
}

func (r *bookRequest) Validate() error {
	return validate.Required(map[string]string{"title": r.Title})
}

func (h *BookHandler) AdminCreate(c echo.Context) error {
	var req bookRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	author := req.Author
	if author == "" {
		author = "Akintola Samuel"
	}

	book, err := h.books.Create(c.Request().Context(), service.CreateBookInput{
		Title: req.Title, Author: author, Description: req.Description,
		CoverImageURL: req.CoverImageURL, FileURL: req.FileURL,
		PriceKobo: req.PriceKobo, PriceUSDCents: req.PriceUSDCents, IsPublished: req.IsPublished,
	})
	if err != nil {
		return response.Internal(c, "could not create book")
	}
	return response.Created(c, "book created", book)
}

func (h *BookHandler) AdminUpdate(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid book id", nil)
	}

	var req bookRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	book, err := h.books.Update(c.Request().Context(), id, service.CreateBookInput{
		Title: req.Title, Author: req.Author, Description: req.Description,
		CoverImageURL: req.CoverImageURL, FileURL: req.FileURL,
		PriceKobo: req.PriceKobo, PriceUSDCents: req.PriceUSDCents, IsPublished: req.IsPublished,
	})
	if err != nil {
		return response.Internal(c, "could not update book")
	}
	return response.OK(c, "book updated", book)
}

func (h *BookHandler) AdminDelete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid book id", nil)
	}
	if err := h.books.Delete(c.Request().Context(), id); err != nil {
		return response.Internal(c, "could not delete book")
	}
	return response.NoContent(c)
}
