package main

import (
	"github.com/gorilla/mux"
	"encoding/json"
	"log"
	"net/http"
	"fmt"
	"bufio"
	"bytes"
)

func main() {
	r := mux.NewRouter()
    r.HandleFunc("/api/upload", PromptHandler)
    http.Handle("/", r)

	fmt.Println("Server running on :8080")
    log.Fatal(http.ListenAndServe(":2346", nil))
}

type Response struct {
	Response string  `json:"response"`
	Done bool  `json:"done"`
}

type Request struct {
	Model string `json:"model"`
	Prompt string `json:"prompt"`
}

func PromptHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Transfer-Encoding", "chunked")

	b, _ := json.Marshal(Request{Model: "gemma3:1b", Prompt: "Can you give me stats on wills valorant performance"})
	rd := bytes.NewReader(b)

	req, _ := http.NewRequest(http.MethodPost, "http://localhost:11434/api/generate", rd)
 	res, _ := http.DefaultClient.Do(req)

	scanner := bufio.NewScanner(res.Body)
	for scanner.Scan() {
		foo := make(map[string]interface{})
		_ = json.Unmarshal([]byte(scanner.Text()), &foo)
		// Do something with foo
		fmt.Println(foo)
	}
}