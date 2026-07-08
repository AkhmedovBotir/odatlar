package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func ErrorLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		if c.Writer.Status() < 500 {
			return
		}

		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[500] %s %s | %13v | %15s",
			c.Request.Method,
			path,
			time.Since(start),
			c.ClientIP(),
		)

		for _, e := range c.Errors {
			log.Printf("[500] %s", e.Error())
		}
	}
}
