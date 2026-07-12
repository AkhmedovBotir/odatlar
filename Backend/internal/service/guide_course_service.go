package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/odatlar-bot/backend/internal/domain"
	"github.com/odatlar-bot/backend/internal/dto"
	"github.com/odatlar-bot/backend/internal/repository"
)

var (
	ErrInvalidCourseSlug      = errors.New("invalid course slug")
	ErrDuplicateCourseSlug    = errors.New("duplicate course slug")
	ErrInvalidCourseContent   = errors.New("invalid course content")
	ErrGuideLessonNotFound    = errors.New("guide lesson not found")
)

var courseSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type GuideCourseService struct {
	courseRepo *repository.GuideCourseRepository
}

func NewGuideCourseService(courseRepo *repository.GuideCourseRepository) *GuideCourseService {
	return &GuideCourseService{courseRepo: courseRepo}
}

func (s *GuideCourseService) AdminList(ctx context.Context) (*dto.GuideCourseListResponse, error) {
	courses, err := s.courseRepo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideCourseResponse, 0, len(courses))
	for i := range courses {
		data = append(data, s.toAdminListItem(&courses[i]))
	}
	return &dto.GuideCourseListResponse{Data: data}, nil
}

func (s *GuideCourseService) AdminGet(ctx context.Context, ref string) (*dto.GuideCourseResponse, error) {
	c, err := s.resolveCourseRef(ctx, ref, false)
	if err != nil {
		return nil, err
	}
	item := s.toAdminFullResponse(c)
	return &item, nil
}

func (s *GuideCourseService) AdminCreate(ctx context.Context, req dto.CreateGuideCourseRequest) (*dto.GuideCourseResponse, error) {
	slug, err := normalizeCourseSlug(req.Slug)
	if err != nil {
		return nil, err
	}
	if err := validateCourseChildren(req.Children); err != nil {
		return nil, err
	}
	exists, err := s.courseRepo.SlugExists(ctx, slug, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateCourseSlug
	}
	published := true
	if req.IsPublished != nil {
		published = *req.IsPublished
	}
	created, err := s.courseRepo.Create(ctx, &domain.GuideCourse{
		Slug:        slug,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Content:     req.Children,
		SortOrder:   req.SortOrder,
		IsPublished: published,
	})
	if err != nil {
		return nil, err
	}
	item := s.toAdminFullResponse(created)
	return &item, nil
}

func (s *GuideCourseService) AdminUpdate(ctx context.Context, ref string, req dto.UpdateGuideCourseRequest) (*dto.GuideCourseResponse, error) {
	existing, err := s.resolveCourseRef(ctx, ref, false)
	if err != nil {
		return nil, err
	}
	slug, err := normalizeCourseSlug(req.Slug)
	if err != nil {
		return nil, err
	}
	if err := validateCourseChildren(req.Children); err != nil {
		return nil, err
	}
	exists, err := s.courseRepo.SlugExists(ctx, slug, existing.ID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateCourseSlug
	}
	updated, err := s.courseRepo.Update(ctx, &domain.GuideCourse{
		ID:          existing.ID,
		Slug:        slug,
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		Content:     req.Children,
		SortOrder:   req.SortOrder,
		IsPublished: req.IsPublished,
	})
	if err != nil {
		return nil, err
	}
	item := s.toAdminFullResponse(updated)
	return &item, nil
}

func (s *GuideCourseService) AdminDelete(ctx context.Context, ref string) error {
	existing, err := s.resolveCourseRef(ctx, ref, false)
	if err != nil {
		return err
	}
	return s.courseRepo.Delete(ctx, existing.ID)
}

func (s *GuideCourseService) ListPublished(ctx context.Context) (*dto.GuideCourseListResponse, error) {
	courses, err := s.courseRepo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	data := make([]dto.GuideCourseResponse, 0, len(courses))
	for i := range courses {
		data = append(data, s.toUserListItem(&courses[i]))
	}
	return &dto.GuideCourseListResponse{Data: data}, nil
}

func (s *GuideCourseService) GetPublished(ctx context.Context, courseID string) (*dto.GuideCourseResponse, error) {
	c, err := s.courseRepo.GetPublishedBySlug(ctx, strings.TrimSpace(courseID))
	if err != nil {
		return nil, err
	}
	item := s.toUserFullResponse(c)
	return &item, nil
}

func (s *GuideCourseService) GetLesson(ctx context.Context, lessonID string) (*dto.GuideLessonResponse, error) {
	lessonID = strings.TrimSpace(lessonID)
	if lessonID == "" {
		return nil, ErrGuideLessonNotFound
	}
	courses, err := s.courseRepo.ListPublished(ctx)
	if err != nil {
		return nil, err
	}
	for i := range courses {
		found, err := findLessonInCourse(&courses[i], lessonID)
		if err != nil {
			return nil, err
		}
		if found != nil {
			return found, nil
		}
	}
	return nil, ErrGuideLessonNotFound
}

func (s *GuideCourseService) resolveCourseRef(ctx context.Context, ref string, publishedOnly bool) (*domain.GuideCourse, error) {
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return nil, repository.ErrGuideCourseNotFound
	}
	if id, err := strconv.ParseInt(ref, 10, 64); err == nil && id > 0 {
		if publishedOnly {
			return s.courseRepo.GetPublishedByID(ctx, id)
		}
		return s.courseRepo.GetByID(ctx, id)
	}
	if publishedOnly {
		return s.courseRepo.GetPublishedBySlug(ctx, ref)
	}
	return s.courseRepo.GetBySlug(ctx, ref)
}

func (s *GuideCourseService) toAdminListItem(c *domain.GuideCourse) dto.GuideCourseResponse {
	lessons, sections := countCourseTree(c.Content)
	return dto.GuideCourseResponse{
		ID:           c.Slug,
		Title:        c.Title,
		Description:  c.Description,
		LessonCount:  lessons,
		SectionCount: sections,
		SortOrder:    c.SortOrder,
		IsPublished:  c.IsPublished,
		CreatedAt:    c.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:    c.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func (s *GuideCourseService) toAdminFullResponse(c *domain.GuideCourse) dto.GuideCourseResponse {
	item := s.toAdminListItem(c)
	item.Children = c.Content
	return item
}

func (s *GuideCourseService) toUserListItem(c *domain.GuideCourse) dto.GuideCourseResponse {
	lessons, sections := countCourseTree(c.Content)
	return dto.GuideCourseResponse{
		ID:           c.Slug,
		Title:        c.Title,
		Description:  c.Description,
		LessonCount:  lessons,
		SectionCount: sections,
	}
}

func (s *GuideCourseService) toUserFullResponse(c *domain.GuideCourse) dto.GuideCourseResponse {
	item := s.toUserListItem(c)
	item.Children = c.Content
	return item
}

func normalizeCourseSlug(raw string) (string, error) {
	slug := strings.ToLower(strings.TrimSpace(raw))
	if slug == "" || len(slug) > 100 || !courseSlugPattern.MatchString(slug) {
		return "", ErrInvalidCourseSlug
	}
	return slug, nil
}

func validateCourseChildren(children json.RawMessage) error {
	if len(children) == 0 {
		return fmt.Errorf("%w: children required", ErrInvalidCourseContent)
	}
	var nodes []json.RawMessage
	if err := json.Unmarshal(children, &nodes); err != nil {
		return fmt.Errorf("%w: children must be an array", ErrInvalidCourseContent)
	}
	for i, node := range nodes {
		if err := validateCourseNode(node, fmt.Sprintf("children[%d]", i)); err != nil {
			return err
		}
	}
	return nil
}

func validateCourseNode(node json.RawMessage, path string) error {
	var meta struct {
		Kind string `json:"kind"`
		ID   string `json:"id"`
	}
	if err := json.Unmarshal(node, &meta); err != nil {
		return fmt.Errorf("%w: invalid node at %s", ErrInvalidCourseContent, path)
	}
	meta.Kind = strings.TrimSpace(meta.Kind)
	meta.ID = strings.TrimSpace(meta.ID)
	if meta.ID == "" {
		return fmt.Errorf("%w: missing id at %s", ErrInvalidCourseContent, path)
	}
	switch meta.Kind {
	case "dars":
		var lesson struct {
			Blocks []json.RawMessage `json:"blocks"`
		}
		if err := json.Unmarshal(node, &lesson); err != nil {
			return fmt.Errorf("%w: invalid lesson at %s", ErrInvalidCourseContent, path)
		}
		if len(lesson.Blocks) == 0 {
			return fmt.Errorf("%w: lesson blocks required at %s", ErrInvalidCourseContent, path)
		}
		return nil
	case "bolim":
		var section struct {
			Children []json.RawMessage `json:"children"`
		}
		if err := json.Unmarshal(node, &section); err != nil {
			return fmt.Errorf("%w: invalid section at %s", ErrInvalidCourseContent, path)
		}
		if len(section.Children) == 0 {
			return fmt.Errorf("%w: section children required at %s", ErrInvalidCourseContent, path)
		}
		for i, child := range section.Children {
			if err := validateCourseNode(child, fmt.Sprintf("%s.children[%d]", path, i)); err != nil {
				return err
			}
			var childKind struct {
				Kind string `json:"kind"`
			}
			_ = json.Unmarshal(child, &childKind)
			if strings.TrimSpace(childKind.Kind) != "dars" {
				return fmt.Errorf("%w: nested sections are not supported at %s", ErrInvalidCourseContent, path)
			}
		}
		return nil
	default:
		return fmt.Errorf("%w: unknown kind %q at %s", ErrInvalidCourseContent, meta.Kind, path)
	}
}

func countCourseTree(content json.RawMessage) (lessons, sections int) {
	var nodes []json.RawMessage
	if err := json.Unmarshal(content, &nodes); err != nil {
		return 0, 0
	}
	for _, node := range nodes {
		var meta struct {
			Kind     string            `json:"kind"`
			Children []json.RawMessage `json:"children"`
		}
		if err := json.Unmarshal(node, &meta); err != nil {
			continue
		}
		switch strings.TrimSpace(meta.Kind) {
		case "dars":
			lessons++
		case "bolim":
			sections++
			for _, child := range meta.Children {
				var childKind struct {
					Kind string `json:"kind"`
				}
				_ = json.Unmarshal(child, &childKind)
				if strings.TrimSpace(childKind.Kind) == "dars" {
					lessons++
				}
			}
		}
	}
	return lessons, sections
}

func findLessonInCourse(course *domain.GuideCourse, lessonID string) (*dto.GuideLessonResponse, error) {
	var nodes []json.RawMessage
	if err := json.Unmarshal(course.Content, &nodes); err != nil {
		return nil, err
	}

	courseCrumb := dto.GuideCourseBreadcrumbItem{
		ID:    course.Slug,
		Title: course.Title,
		Href:  "/qollanma/kurs/" + course.Slug,
	}

	var walk func([]json.RawMessage, []dto.GuideCourseBreadcrumbItem) (*dto.GuideLessonResponse, error)
	walk = func(items []json.RawMessage, trail []dto.GuideCourseBreadcrumbItem) (*dto.GuideLessonResponse, error) {
		for _, node := range items {
			var meta struct {
				Kind     string            `json:"kind"`
				ID       string            `json:"id"`
				Title    string            `json:"title"`
				Children []json.RawMessage `json:"children"`
			}
			if err := json.Unmarshal(node, &meta); err != nil {
				continue
			}
			switch strings.TrimSpace(meta.Kind) {
			case "dars":
				if strings.TrimSpace(meta.ID) == lessonID {
					return &dto.GuideLessonResponse{
						Lesson: node,
						Breadcrumb: append(trail, dto.GuideCourseBreadcrumbItem{
							ID:    meta.ID,
							Title: meta.Title,
							Href:  "/qollanma/dars/" + meta.ID,
						}),
						Course: dto.GuideCourseSummary{
							ID:          course.Slug,
							Title:       course.Title,
							Description: course.Description,
						},
					}, nil
				}
			case "bolim":
				sectionTrail := append(trail, dto.GuideCourseBreadcrumbItem{
					ID:    meta.ID,
					Title: meta.Title,
					Href:  "/qollanma/kurs/" + course.Slug,
				})
				if found, err := walk(meta.Children, sectionTrail); err != nil || found != nil {
					return found, err
				}
			}
		}
		return nil, nil
	}

	return walk(nodes, []dto.GuideCourseBreadcrumbItem{courseCrumb})
}
