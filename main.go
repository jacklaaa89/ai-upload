package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()

	// file uploads.
	r.HandleFunc("/api/upload", UploadHandler)

	// handle file retrivals.
	r.PathPrefix("/api/uploads/").Handler(http.StripPrefix("/api/uploads/", http.FileServer(http.Dir("./uploads"))))

	http.Handle("/", r)

	fmt.Println("Server running on :2346")
	log.Fatal(http.ListenAndServe(":2346", nil))
}

func UploadHandler(w http.ResponseWriter, r *http.Request) {
	// max total size 20mb
	r.ParseMultipartForm(200 << 20)

	fhs := r.MultipartForm.File["files"]
	if len(fhs) == 0 {
		w.WriteHeader(400)
		return
	}

	files, err := saveFiles(fhs)
	if err != nil {
		fmt.Printf("Error saving file. Reason: %s\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(files)
}

func PromptHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Transfer-Encoding", "chunked")

}

type Response struct {
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

type Request struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type File struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
	Size int    `json:"size"`
	URL  string `json:"url"`
}

func saveFiles(l []*multipart.FileHeader) ([]*File, error) {
	files := make([]*File, 0, len(l))
	for _, e := range l {
		mf, err := e.Open()
		if err != nil {
			return nil, err
		}

		f, err := saveFile(mf, e)
		if err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, nil
}

func saveFile(f multipart.File, h *multipart.FileHeader) (*File, error) {
	defer f.Close()
	u := uuid.New()
	id := u.String()

	fileName := fmt.Sprintf("%s%s", id, filepath.Ext(h.Filename))
	file, err := os.Create(filepath.Join("uploads", fileName))
	if err != nil {
		errStr := fmt.Sprintf("Error in creating the file. Reason: %s\n", err)
		fmt.Println(errStr)
		return nil, err
	}

	defer file.Close()

	filebytes, err := io.ReadAll(f)
	if err != nil {
		errStr := fmt.Sprintf("Error in reading the file buffer. Reason: %s\n", err)
		fmt.Println(errStr)
		return nil, err
	}

	file.Write(filebytes)

	return &File{
		Id:   id,
		Name: fileName,
		URL:  fmt.Sprintf("/uploads/%s", fileName),
		Type: h.Header.Get("Content-Type"),
		Size: int(h.Size),
	}, nil
}
