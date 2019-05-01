package channel

import (
	"crypto/tls"
	"net/smtp"
)

type smtpconn struct {
	addr string
	from string
	to   string
}

func (ch *smtpconn) Send(msg []byte) error {
	conn, err := tls.Dial("tcp", "smtp.gmail.com:465", &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         "smtp.gmail.com",
	})
	if err != nil {
		return err
	}

	c, err := smtp.NewClient(conn, "smtp.gmail.com")
	if err != nil {
		return err
	}
	defer c.Quit()

	if err = c.Auth(smtp.PlainAuth("", "alexander.gurinov@gmail.com", "dkmrxfoxmnjtrwyo", "smtp.gmail.com")); err != nil {
		return err
	}

	// Set the sender and recipient.
	c.Mail("alexander.gurinov@gmail.com")
	c.Rcpt("agurinov@jetsmarter.com")
	// Send the email body.
	w, err := c.Data()
	if err != nil {
		return err
	}
	defer w.Close()

	_, err = w.Write(msg)
	if err != nil {
		return err
	}

	return nil
}

func SMTP() Interface {
	return &smtpconn{
		addr: "0.0.0.0:25",
		from: "test@boomfunc.io",
		to:   "alexander.gurinov@gmail.com",
	}
}
