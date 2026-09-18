package mailer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Mailer interface {
	SendTransactional(toEmail, toName, subject, htmlContent string) error
	AddContactToList(email string, listID int) error
}

type brevoMailer struct {
	apiKey      string
	senderEmail string
	senderName  string
	client      *http.Client
}

func NewBrevoMailer(apiKey, senderEmail, senderName string) Mailer {
	return &brevoMailer{
		apiKey:      apiKey,
		senderEmail: senderEmail,
		senderName:  senderName,
		client:      &http.Client{},
	}
}

const brevoBaseURL = "https://api.brevo.com/v3"

type sendEmailRequest struct {
	Sender      contact   `json:"sender"`
	To          []contact `json:"to"`
	Subject     string    `json:"subject"`
	HTMLContent string    `json:"htmlContent"`
}

type contact struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

func (b *brevoMailer) SendTransactional(toEmail, toName, subject, htmlContent string) error {
	payload := sendEmailRequest{
		Sender:      contact{Email: b.senderEmail, Name: b.senderName},
		To:          []contact{{Email: toEmail, Name: toName}},
		Subject:     subject,
		HTMLContent: htmlContent,
	}
	return b.post("/smtp/email", payload)
}

type addContactRequest struct {
	Email         string `json:"email"`
	ListIDs       []int  `json:"listIds"`
	UpdateEnabled bool   `json:"updateEnabled"`
}

func (b *brevoMailer) AddContactToList(email string, listID int) error {
	payload := addContactRequest{
		Email:         email,
		ListIDs:       []int{listID},
		UpdateEnabled: true,
	}
	return b.post("/contacts", payload)
}

func (b *brevoMailer) post(path string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, brevoBaseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("api-key", b.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := b.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("brevo: request to %s failed with status %d", path, resp.StatusCode)
	}
	return nil
}
