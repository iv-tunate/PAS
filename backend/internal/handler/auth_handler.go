package handler

import (
	"errors"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/middleware"
	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
	"github.com/iv-tunate/PAS/pkg/validate"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

type signUpRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *signUpRequest) Validate() error {
	if err := validate.Required(map[string]string{
		"full_name": r.FullName, "email": r.Email, "password": r.Password,
	}); err != nil {
		return err
	}
	if !strings.Contains(r.Email, "@") {
		return errors.New("email is not valid")
	}
	if len(r.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}

func (h *AuthHandler) SignUp(c echo.Context) error {
	var req signUpRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	user, err := h.auth.SignUp(c.Request().Context(), req.FullName, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			return response.Conflict(c, "email_taken", err.Error())
		}
		return response.Internal(c, "could not create account")
	}

	return response.Created(c, "account created", echo.Map{
		"id":        user.ID,
		"full_name": user.FullName,
		"email":     user.Email,
	})
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r *loginRequest) Validate() error {
	return validate.Required(map[string]string{"email": r.Email, "password": r.Password})
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	user, tokens, err := h.auth.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		return response.Unauthorized(c, "invalid email or password")
	}

	return response.OK(c, "logged in", echo.Map{
		"user": echo.Map{
			"id":        user.ID,
			"full_name": user.FullName,
			"email":     user.Email,
			"role":      user.Role,
		},
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
		"expires_in":    tokens.ExpiresIn,
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (r *refreshRequest) Validate() error {
	return validate.Required(map[string]string{"refresh_token": r.RefreshToken})
}

func (h *AuthHandler) Refresh(c echo.Context) error {
	var req refreshRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	tokens, err := h.auth.Refresh(c.Request().Context(), req.RefreshToken)
	if err != nil {
		return response.Unauthorized(c, "session expired — please log in again")
	}

	return response.OK(c, "token refreshed", echo.Map{
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
		"expires_in":    tokens.ExpiresIn,
	})
}

func (h *AuthHandler) Logout(c echo.Context) error {
	var req refreshRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}
	_ = h.auth.Logout(c.Request().Context(), req.RefreshToken)
	return response.OK(c, "logged out", nil)
}

// Me returns the identity of whoever the bearer token belongs to —
// handy for the frontend to check session state on page load.
func (h *AuthHandler) Me(c echo.Context) error {
	claims := middleware.Claims(c)
	return response.OK(c, "", echo.Map{
		"user_id": claims.UserID,
		"role":    claims.Role,
	})
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

func (r *forgotPasswordRequest) Validate() error {
	return validate.Required(map[string]string{"email": r.Email})
}

// ForgotPassword always responds the same way regardless of whether the
// email is registered — see AuthService.RequestPasswordReset for why.
func (h *AuthHandler) ForgotPassword(c echo.Context, resetURLBase string) error {
	var req forgotPasswordRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	if err := h.auth.RequestPasswordReset(c.Request().Context(), req.Email, resetURLBase); err != nil {
		return response.Internal(c, "could not process request")
	}

	return response.OK(c, "if that email is registered, a reset link has been sent", nil)
}

type resetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

func (r *resetPasswordRequest) Validate() error {
	if err := validate.Required(map[string]string{"token": r.Token, "new_password": r.NewPassword}); err != nil {
		return err
	}
	if len(r.NewPassword) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}

func (h *AuthHandler) ResetPassword(c echo.Context) error {
	var req resetPasswordRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	if err := h.auth.ResetPassword(c.Request().Context(), req.Token, req.NewPassword); err != nil {
		if errors.Is(err, service.ErrInvalidToken) {
			return response.BadRequest(c, "invalid_token", "this reset link is invalid or has expired", nil)
		}
		return response.Internal(c, "could not reset password")
	}

	return response.OK(c, "password updated — please log in again", nil)
}
