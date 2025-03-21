package main

import (
	"github.com/gorilla/mux"
	"encoding/json"
	"log"
	"net/http"
	"fmt"
	"time"
)

func main() {
	r := mux.NewRouter()
    r.HandleFunc("/api/upload", PromptHandler)
    http.Handle("/", r)

	fmt.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":2345", nil))
}

type Response struct {
	Response string  `json:"response"`
	Done bool  `json:"done"`
}

func PromptHandler(w http.ResponseWriter, r *http.Request) {
	list :=[]string{"This", "is", "a", "test"}
	for i,e := range list {
		enc := json.NewEncoder(w)
		enc.Encode(Response{Response: e, Done: i == len(list)-1})
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
		time.Sleep(time.Second)
	}
}