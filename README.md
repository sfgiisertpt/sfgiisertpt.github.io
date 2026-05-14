# sfgiisertpt.github.io

Website for the Star Formation Group at IISER Tirupati.

## Local development

This is a static site, so any simple HTTP server will work.

1. Open a terminal in the project root.
2. Run a local server (pick one):

	```bash
	# Python 3
	python3 -m http.server 8000
	```

3. Open http://localhost:8000 in your browser.

Notes:
- If port 8000 is in use, choose another (e.g., 8080).
- You can also use the VS Code Live Server extension if you prefer.

## GitHub Pages hosting

### User/Organization site (recommended for this repo)

Because this repo is named `sfgiisertpt.github.io`, it can be served as a user/org site.

1. Push the site to the default branch (usually `main`).
2. In GitHub: Settings -> Pages.
3. Source: Deploy from a branch.
4. Branch: `main` and folder: `/ (root)`.
5. Save and wait for the build to finish.

Your site will be available at:
`https://<username-or-org>.github.io/`

### Project site (if you rename the repo)

If you rename the repo to something else, set GitHub Pages to deploy from `main` / `/ (root)`.
The URL will be:
`https://<username-or-org>.github.io/<repo-name>/`

## To-Do List

- [ ] **Homepage Content**: Finalize the text and content on the homepage. Currently, 4 research area cards are included to test the design.
- [ ] **Team Page**: Collect and upload details, photos, and links for all group members (a Google Form will be sent out for this).
- [ ] **Research Pages**: Draft detailed "blog-style" content for each specific research area. 
- [ ] **Publications**: Ensure all publications are completely updated in the corresponding `.bib` files (e.g., `data/publications/selected_publications.bib`).
- [ ] **Site Maintenance Guide**: Create brief documentation/tutorial for group members on how to safely update HTML pages, add new publications, and modify their profiles.
- [ ] **Remove Placeholder Text**: Replace all remaining "Lorem Ipsum" text across the site (e.g., the subtitle on the homepage, and section headers in `pages/team.html`).
- [ ] **Join Us Section**: Update the open positions/recruitment text in the "Join Us" section at the bottom of the Team page (or hide it if there are no open positions right now).
- [ ] **Facilities Section**: Finalize the text and ensure appropriate logos are added for the observational facilities section on the homepage.
- [ ] **ALUMNI SECTION**: Add something for the alumni section.
- [ ] Verify KaTeX integration
- [ ] News Section
- [ ] NASA APOD on home page