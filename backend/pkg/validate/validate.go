package validate

import (
	"errors"
	"strings"

	"github.com/labstack/echo/v4"
)

type Validatable interface {
	Validate() error
}

func BindAndValidate(c echo.Context, dst Validatable) error {
	if err := c.Bind(dst); err != nil {
		return errors.New("request body could not be parsed")
	}
	if err := dst.Validate(); err != nil {
		return err
	}
	return nil
}

func Required(fields map[string]string) error {
	var missing []string
	for name, value := range fields {
		if strings.TrimSpace(value) == "" {
			missing = append(missing, name)
		}
	}
	if len(missing) > 0 {
		return errors.New("missing required field(s): " + strings.Join(missing, ", "))
	}
	return nil
}
