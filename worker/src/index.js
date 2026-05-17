/**
 * Smart Gateway — Cloudflare Worker
 *
 * An intelligent API gateway that translates natural language queries
 * into backend API calls using Cloudflare Workers AI, then formats
 * the response back into natural language.
 *
 * Deploy: wrangler deploy
 */

// ─── Frontend HTML (base64-encoded) ──────────────────────────────────────────

const FRONTEND_HTML = atob("PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAiPgo8dGl0bGU+TmF0dXJhbCBHYXRlPC90aXRsZT4KPGxpbmsgaHJlZj0iaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1KZXRCcmFpbnMrTW9ubzp3Z2h0QDQwMDs1MDA7NzAwJmZhbWlseT1ETStTYW5zOndnaHRANDAwOzUwMDs2MDA7NzAwJmRpc3BsYXk9c3dhcCIgcmVsPSJzdHlsZXNoZWV0Ij4KPHN0eWxlPgogIDpyb290IHsKICAgIC0tZGFyay1uYXZ5OiAjMEYxNzI5OwogICAgLS1uYXZ5OiAjMUIyODQ1OwogICAgLS1kZWVwLWJsdWU6ICMwNjVBODI7CiAgICAtLXRlYWw6ICMwODkxQjI7CiAgICAtLW9yYW5nZTogI0Y2ODIxRjsKICAgIC0td2hpdGU6ICNGRkZGRkY7CiAgICAtLW9mZi13aGl0ZTogI0YwRjRGODsKICAgIC0tbGlnaHQtZ3JheTogIzk0QTNCODsKICAgIC0tbWlkLWdyYXk6ICM2NDc0OEI7CiAgICAtLWRhcmstdGV4dDogIzFFMjkzQjsKICAgIC0tY2FyZC1iZzogIzFFMkQ0QTsKICAgIC0tdGVybWluYWwtYmc6ICMwQTBGMUM7CiAgICAtLXN1Y2Nlc3M6ICMxMEI5ODE7CiAgICAtLWVycm9yOiAjRUY0NDQ0OwogIH0KCiAgKiB7IG1hcmdpbjogMDsgcGFkZGluZzogMDsgYm94LXNpemluZzogYm9yZGVyLWJveDsgfQoKICBib2R5IHsKICAgIGJhY2tncm91bmQ6IHZhcigtLWRhcmstbmF2eSk7CiAgICBjb2xvcjogdmFyKC0td2hpdGUpOwogICAgZm9udC1mYW1pbHk6ICdETSBTYW5zJywgc2Fucy1zZXJpZjsKICAgIG1pbi1oZWlnaHQ6IDEwMHZoOwogICAgb3ZlcmZsb3cteDogaGlkZGVuOwogIH0KCiAgYm9keTo6YmVmb3JlIHsKICAgIGNvbnRlbnQ6ICcnOwogICAgcG9zaXRpb246IGZpeGVkOwogICAgdG9wOiAtMzAlOyByaWdodDogLTIwJTsKICAgIHdpZHRoOiA3MDBweDsgaGVpZ2h0OiA3MDBweDsKICAgIGJhY2tncm91bmQ6IHJhZGlhbC1ncmFkaWVudChjaXJjbGUsIHJnYmEoOCwxNDUsMTc4LDAuMDgpIDAlLCB0cmFuc3BhcmVudCA3MCUpOwogICAgYm9yZGVyLXJhZGl1czogNTAlOwogICAgYW5pbWF0aW9uOiBmbG9hdCAyMHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7CiAgICBwb2ludGVyLWV2ZW50czogbm9uZTsKICAgIHotaW5kZXg6IDA7CiAgfQogIGJvZHk6OmFmdGVyIHsKICAgIGNvbnRlbnQ6ICcnOwogICAgcG9zaXRpb246IGZpeGVkOwogICAgYm90dG9tOiAtMjAlOyBsZWZ0OiAtMTAlOwogICAgd2lkdGg6IDUwMHB4OyBoZWlnaHQ6IDUwMHB4OwogICAgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KGNpcmNsZSwgcmdiYSgyNDYsMTMwLDMxLDAuMDYpIDAlLCB0cmFuc3BhcmVudCA3MCUpOwogICAgYm9yZGVyLXJhZGl1czogNTAlOwogICAgYW5pbWF0aW9uOiBmbG9hdCAyNXMgZWFzZS1pbi1vdXQgaW5maW5pdGUgcmV2ZXJzZTsKICAgIHBvaW50ZXItZXZlbnRzOiBub25lOwogICAgei1pbmRleDogMDsKICB9CgogIEBrZXlmcmFtZXMgZmxvYXQgewogICAgMCUsIDEwMCUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwKSBzY2FsZSgxKTsgfQogICAgMzMlIHsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMzBweCwgLTQwcHgpIHNjYWxlKDEuMDUpOyB9CiAgICA2NiUgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMjBweCwgMjBweCkgc2NhbGUoMC45NSk7IH0KICB9CgogIC5hcHAgewogICAgcG9zaXRpb246IHJlbGF0aXZlOwogICAgei1pbmRleDogMTsKICAgIG1heC13aWR0aDogOTAwcHg7CiAgICBtYXJnaW46IDAgYXV0bzsKICAgIHBhZGRpbmc6IDJyZW0gMS41cmVtIDRyZW07CiAgfQoKICAuaGVhZGVyIHsKICAgIGRpc3BsYXk6IGZsZXg7CiAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgZ2FwOiAxcmVtOwogICAgbWFyZ2luLWJvdHRvbTogMC41cmVtOwogICAgYW5pbWF0aW9uOiBzbGlkZURvd24gMC42cyBlYXNlLW91dDsKICB9CiAgLmxvZ28gewogICAgd2lkdGg6IDQwcHg7IGhlaWdodDogNDBweDsKICAgIGJhY2tncm91bmQ6IHZhcigtLW9yYW5nZSk7CiAgICBib3JkZXItcmFkaXVzOiAxMHB4OwogICAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgICBmb250LXNpemU6IDIwcHg7CiAgICBib3gtc2hhZG93OiAwIDRweCAyMHB4IHJnYmEoMjQ2LDEzMCwzMSwwLjMpOwogIH0KICAuaGVhZGVyIGgxIHsKICAgIGZvbnQtZmFtaWx5OiAnRE0gU2FucycsIHNhbnMtc2VyaWY7CiAgICBmb250LXNpemU6IDEuNnJlbTsKICAgIGZvbnQtd2VpZ2h0OiA3MDA7CiAgICBsZXR0ZXItc3BhY2luZzogLTAuMDJlbTsKICB9CiAgLmhlYWRlciBoMSBzcGFuIHsgY29sb3I6IHZhcigtLW9yYW5nZSk7IH0KICAudGFnbGluZSB7CiAgICBjb2xvcjogdmFyKC0tbWlkLWdyYXkpOwogICAgZm9udC1zaXplOiAwLjlyZW07CiAgICBtYXJnaW4tYm90dG9tOiAyLjVyZW07CiAgICBwYWRkaW5nLWxlZnQ6IDU2cHg7CiAgICBhbmltYXRpb246IHNsaWRlRG93biAwLjZzIGVhc2Utb3V0IDAuMXMgYm90aDsKICB9CgogIC5pbnB1dC1zZWN0aW9uIHsKICAgIGFuaW1hdGlvbjogc2xpZGVVcCAwLjVzIGVhc2Utb3V0IDAuMnMgYm90aDsKICB9CiAgLmlucHV0LXdyYXBwZXIgewogICAgcG9zaXRpb246IHJlbGF0aXZlOwogICAgZGlzcGxheTogZmxleDsKICAgIGdhcDogMC41cmVtOwogICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7CiAgfQogIC5xdWVyeS1pbnB1dCB7CiAgICBmbGV4OiAxOwogICAgYmFja2dyb3VuZDogdmFyKC0tY2FyZC1iZyk7CiAgICBib3JkZXI6IDEuNXB4IHNvbGlkIHJnYmEoMTQ4LDE2MywxODQsMC4xNSk7CiAgICBib3JkZXItcmFkaXVzOiAxMnB4OwogICAgcGFkZGluZzogMXJlbSAxLjI1cmVtOwogICAgY29sb3I6IHZhcigtLXdoaXRlKTsKICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7CiAgICBmb250LXNpemU6IDAuOTVyZW07CiAgICBvdXRsaW5lOiBub25lOwogICAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuM3MsIGJveC1zaGFkb3cgMC4zczsKICB9CiAgLnF1ZXJ5LWlucHV0OjpwbGFjZWhvbGRlciB7IGNvbG9yOiB2YXIoLS1taWQtZ3JheSk7IH0KICAucXVlcnktaW5wdXQ6Zm9jdXMgewogICAgYm9yZGVyLWNvbG9yOiB2YXIoLS10ZWFsKTsKICAgIGJveC1zaGFkb3c6IDAgMCAwIDNweCByZ2JhKDgsMTQ1LDE3OCwwLjE1KTsKICB9CiAgLnNlbmQtYnRuIHsKICAgIGJhY2tncm91bmQ6IHZhcigtLW9yYW5nZSk7CiAgICBib3JkZXI6IG5vbmU7CiAgICBib3JkZXItcmFkaXVzOiAxMnB4OwogICAgcGFkZGluZzogMCAxLjVyZW07CiAgICBjb2xvcjogdmFyKC0td2hpdGUpOwogICAgZm9udC1mYW1pbHk6ICdETSBTYW5zJywgc2Fucy1zZXJpZjsKICAgIGZvbnQtd2VpZ2h0OiA2MDA7CiAgICBmb250LXNpemU6IDAuOTVyZW07CiAgICBjdXJzb3I6IHBvaW50ZXI7CiAgICB0cmFuc2l0aW9uOiBhbGwgMC4yczsKICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7CiAgICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDAuNXJlbTsKICB9CiAgLnNlbmQtYnRuOmhvdmVyIHsgYmFja2dyb3VuZDogI2U1NzUwZjsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xcHgpOyBib3gtc2hhZG93OiAwIDRweCAxNXB4IHJnYmEoMjQ2LDEzMCwzMSwwLjQpOyB9CiAgLnNlbmQtYnRuOmFjdGl2ZSB7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTsgfQogIC5zZW5kLWJ0bjpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNTsgY3Vyc29yOiBub3QtYWxsb3dlZDsgdHJhbnNmb3JtOiBub25lOyB9CiAgLnNlbmQtYnRuIHN2ZyB7IHdpZHRoOiAxOHB4OyBoZWlnaHQ6IDE4cHg7IH0KCiAgLm9wdGlvbnMtcm93IHsKICAgIGRpc3BsYXk6IGZsZXg7CiAgICBhbGlnbi1pdGVtczogY2VudGVyOwogICAgZ2FwOiAxLjVyZW07CiAgICBtYXJnaW4tdG9wOiAwLjc1cmVtOwogICAgcGFkZGluZy1sZWZ0OiAwLjI1cmVtOwogIH0KICAub3B0aW9uLXRvZ2dsZSB7CiAgICBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDAuNXJlbTsKICAgIGN1cnNvcjogcG9pbnRlcjsKICAgIHVzZXItc2VsZWN0OiBub25lOwogICAgY29sb3I6IHZhcigtLWxpZ2h0LWdyYXkpOwogICAgZm9udC1zaXplOiAwLjgycmVtOwogICAgdHJhbnNpdGlvbjogY29sb3IgMC4yczsKICB9CiAgLm9wdGlvbi10b2dnbGU6aG92ZXIgeyBjb2xvcjogdmFyKC0td2hpdGUpOyB9CiAgLnRvZ2dsZS10cmFjayB7CiAgICB3aWR0aDogMzZweDsgaGVpZ2h0OiAyMHB4OwogICAgYmFja2dyb3VuZDogdmFyKC0tY2FyZC1iZyk7CiAgICBib3JkZXI6IDEuNXB4IHNvbGlkIHJnYmEoMTQ4LDE2MywxODQsMC4yKTsKICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7CiAgICBwb3NpdGlvbjogcmVsYXRpdmU7CiAgICB0cmFuc2l0aW9uOiBhbGwgMC4zczsKICB9CiAgLnRvZ2dsZS10cmFjay5hY3RpdmUgewogICAgYmFja2dyb3VuZDogdmFyKC0tdGVhbCk7CiAgICBib3JkZXItY29sb3I6IHZhcigtLXRlYWwpOwogIH0KICAudG9nZ2xlLXRodW1iIHsKICAgIHdpZHRoOiAxNHB4OyBoZWlnaHQ6IDE0cHg7CiAgICBiYWNrZ3JvdW5kOiB2YXIoLS13aGl0ZSk7CiAgICBib3JkZXItcmFkaXVzOiA1MCU7CiAgICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgICB0b3A6IDJweDsgbGVmdDogMnB4OwogICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuM3M7CiAgfQogIC50b2dnbGUtdHJhY2suYWN0aXZlIC50b2dnbGUtdGh1bWIgeyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTZweCk7IH0KCiAgLmV4YW1wbGVzIHsKICAgIG1hcmdpbi10b3A6IDEuNXJlbTsKICAgIGRpc3BsYXk6IGZsZXg7CiAgICBmbGV4LXdyYXA6IHdyYXA7CiAgICBnYXA6IDAuNXJlbTsKICAgIGFuaW1hdGlvbjogc2xpZGVVcCAwLjVzIGVhc2Utb3V0IDAuMzVzIGJvdGg7CiAgfQogIC5leGFtcGxlcy1sYWJlbCB7CiAgICB3aWR0aDogMTAwJTsKICAgIGZvbnQtc2l6ZTogMC43NXJlbTsKICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7CiAgICBsZXR0ZXItc3BhY2luZzogMC4xZW07CiAgICBjb2xvcjogdmFyKC0tbWlkLWdyYXkpOwogICAgbWFyZ2luLWJvdHRvbTogMC4yNXJlbTsKICB9CiAgLmV4YW1wbGUtY2hpcCB7CiAgICBiYWNrZ3JvdW5kOiByZ2JhKDMwLDQ1LDc0LDAuNik7CiAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDE0OCwxNjMsMTg0LDAuMSk7CiAgICBib3JkZXItcmFkaXVzOiA4cHg7CiAgICBwYWRkaW5nOiAwLjQ1cmVtIDAuODVyZW07CiAgICBjb2xvcjogdmFyKC0tbGlnaHQtZ3JheSk7CiAgICBmb250LXNpemU6IDAuOHJlbTsKICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7CiAgICBjdXJzb3I6IHBvaW50ZXI7CiAgICB0cmFuc2l0aW9uOiBhbGwgMC4yczsKICB9CiAgLmV4YW1wbGUtY2hpcDpob3ZlciB7CiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1jYXJkLWJnKTsKICAgIGJvcmRlci1jb2xvcjogdmFyKC0tdGVhbCk7CiAgICBjb2xvcjogdmFyKC0tdGVhbCk7CiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTFweCk7CiAgfQoKICAucmVzdWx0cy1hcmVhIHsKICAgIG1hcmdpbi10b3A6IDJyZW07CiAgICBkaXNwbGF5OiBmbGV4OwogICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICAgIGdhcDogMXJlbTsKICB9CgogIC5yZXN1bHQtY2FyZCB7CiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1jYXJkLWJnKTsKICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMTQ4LDE2MywxODQsMC4wOCk7CiAgICBib3JkZXItcmFkaXVzOiAxNHB4OwogICAgb3ZlcmZsb3c6IGhpZGRlbjsKICAgIGFuaW1hdGlvbjogZmFkZUluIDAuNHMgZWFzZS1vdXQ7CiAgfQoKICAucmVzdWx0LWhlYWRlciB7CiAgICBkaXNwbGF5OiBmbGV4OwogICAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsKICAgIHBhZGRpbmc6IDAuNzVyZW0gMS4yNXJlbTsKICAgIGJhY2tncm91bmQ6IHJnYmEoMTAsMTUsMjgsMC40KTsKICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDE0OCwxNjMsMTg0LDAuMDYpOwogIH0KICAucmVzdWx0LXF1ZXJ5IHsKICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7CiAgICBmb250LXNpemU6IDAuODVyZW07CiAgICBjb2xvcjogdmFyKC0tb3JhbmdlKTsKICB9CiAgLnJlc3VsdC1tZXRhIHsKICAgIGRpc3BsYXk6IGZsZXg7IGdhcDogMXJlbTsKICAgIGZvbnQtc2l6ZTogMC43NXJlbTsKICAgIGNvbG9yOiB2YXIoLS1taWQtZ3JheSk7CiAgfQogIC5yZXN1bHQtbWV0YSAubWV0aG9kLWJhZGdlIHsKICAgIGJhY2tncm91bmQ6IHJnYmEoOCwxNDUsMTc4LDAuMTUpOwogICAgY29sb3I6IHZhcigtLXRlYWwpOwogICAgcGFkZGluZzogMC4xNXJlbSAwLjVyZW07CiAgICBib3JkZXItcmFkaXVzOiA0cHg7CiAgICBmb250LWZhbWlseTogJ0pldEJyYWlucyBNb25vJywgbW9ub3NwYWNlOwogICAgZm9udC13ZWlnaHQ6IDUwMDsKICB9CgogIC50cmFuc2xhdGlvbi1yb3cgewogICAgcGFkZGluZzogMC42cmVtIDEuMjVyZW07CiAgICBmb250LWZhbWlseTogJ0pldEJyYWlucyBNb25vJywgbW9ub3NwYWNlOwogICAgZm9udC1zaXplOiAwLjhyZW07CiAgICBjb2xvcjogdmFyKC0tdGVhbCk7CiAgICBiYWNrZ3JvdW5kOiByZ2JhKDgsMTQ1LDE3OCwwLjA0KTsKICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDE0OCwxNjMsMTg0LDAuMDYpOwogICAgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAwLjVyZW07CiAgfQogIC50cmFuc2xhdGlvbi1yb3cgLmFycm93IHsgY29sb3I6IHZhcigtLW1pZC1ncmF5KTsgfQoKICAucmVzdWx0LWJvZHkgewogICAgcGFkZGluZzogMXJlbSAxLjI1cmVtOwogIH0KICAucmVzdWx0LWJvZHkgcHJlIHsKICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7CiAgICBmb250LXNpemU6IDAuODJyZW07CiAgICBsaW5lLWhlaWdodDogMS42OwogICAgY29sb3I6IHZhcigtLWxpZ2h0LWdyYXkpOwogICAgd2hpdGUtc3BhY2U6IHByZS13cmFwOwogICAgd29yZC1icmVhazogYnJlYWstd29yZDsKICAgIG1heC1oZWlnaHQ6IDQwMHB4OwogICAgb3ZlcmZsb3cteTogYXV0bzsKICB9CiAgLnJlc3VsdC1ib2R5IHByZTo6LXdlYmtpdC1zY3JvbGxiYXIgeyB3aWR0aDogNnB4OyB9CiAgLnJlc3VsdC1ib2R5IHByZTo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sgeyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgfQogIC5yZXN1bHQtYm9keSBwcmU6Oi13ZWJraXQtc2Nyb2xsYmFyLXRodW1iIHsgYmFja2dyb3VuZDogdmFyKC0tbWlkLWdyYXkpOyBib3JkZXItcmFkaXVzOiAzcHg7IH0KCiAgLnN1bW1hcnktc2VjdGlvbiB7CiAgICBwYWRkaW5nOiAxcmVtIDEuMjVyZW07CiAgICBib3JkZXItdG9wOiAxcHggc29saWQgcmdiYSgxNDgsMTYzLDE4NCwwLjA2KTsKICAgIGJhY2tncm91bmQ6IHJnYmEoOCwxNDUsMTc4LDAuMDMpOwogIH0KICAuc3VtbWFyeS1sYWJlbCB7CiAgICBmb250LXNpemU6IDAuN3JlbTsKICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7CiAgICBsZXR0ZXItc3BhY2luZzogMC4wOGVtOwogICAgY29sb3I6IHZhcigtLXRlYWwpOwogICAgbWFyZ2luLWJvdHRvbTogMC40cmVtOwogIH0KICAuc3VtbWFyeS10ZXh0IHsKICAgIGZvbnQtc2l6ZTogMC45cmVtOwogICAgY29sb3I6IHZhcigtLW9mZi13aGl0ZSk7CiAgICBsaW5lLWhlaWdodDogMS41OwogIH0KCiAgLmxvYWRpbmctY2FyZCB7CiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1jYXJkLWJnKTsKICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMTQ4LDE2MywxODQsMC4wOCk7CiAgICBib3JkZXItcmFkaXVzOiAxNHB4OwogICAgcGFkZGluZzogMnJlbSAxLjI1cmVtOwogICAgZGlzcGxheTogZmxleDsKICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAgICBnYXA6IDFyZW07CiAgICBhbmltYXRpb246IGZhZGVJbiAwLjNzIGVhc2Utb3V0OwogIH0KICAubG9hZGluZy1kb3RzIHsgZGlzcGxheTogZmxleDsgZ2FwOiA0cHg7IH0KICAubG9hZGluZy1kb3RzIHNwYW4gewogICAgd2lkdGg6IDhweDsgaGVpZ2h0OiA4cHg7CiAgICBib3JkZXItcmFkaXVzOiA1MCU7CiAgICBiYWNrZ3JvdW5kOiB2YXIoLS10ZWFsKTsKICAgIGFuaW1hdGlvbjogYm91bmNlIDEuNHMgZWFzZS1pbi1vdXQgaW5maW5pdGU7CiAgfQogIC5sb2FkaW5nLWRvdHMgc3BhbjpudGgtY2hpbGQoMikgeyBhbmltYXRpb24tZGVsYXk6IDAuMTZzOyB9CiAgLmxvYWRpbmctZG90cyBzcGFuOm50aC1jaGlsZCgzKSB7IGFuaW1hdGlvbi1kZWxheTogMC4zMnM7IH0KICAubG9hZGluZy10ZXh0IHsgY29sb3I6IHZhcigtLW1pZC1ncmF5KTsgZm9udC1zaXplOiAwLjlyZW07IH0KCiAgLmVycm9yLWNhcmQgewogICAgYmFja2dyb3VuZDogcmdiYSgyMzksNjgsNjgsMC4wOCk7CiAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDIzOSw2OCw2OCwwLjIpOwogICAgYm9yZGVyLXJhZGl1czogMTRweDsKICAgIHBhZGRpbmc6IDEuMjVyZW07CiAgICBjb2xvcjogdmFyKC0tZXJyb3IpOwogICAgZm9udC1zaXplOiAwLjlyZW07CiAgICBhbmltYXRpb246IGZhZGVJbiAwLjNzIGVhc2Utb3V0OwogIH0KCiAgQGtleWZyYW1lcyBzbGlkZURvd24geyBmcm9tIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC0xNXB4KTsgfSB0byB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTsgfSB9CiAgQGtleWZyYW1lcyBzbGlkZVVwIHsgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgxNXB4KTsgfSB0byB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTsgfSB9CiAgQGtleWZyYW1lcyBmYWRlSW4geyBmcm9tIHsgb3BhY2l0eTogMDsgfSB0byB7IG9wYWNpdHk6IDE7IH0gfQogIEBrZXlmcmFtZXMgYm91bmNlIHsKICAgIDAlLCA4MCUsIDEwMCUgeyB0cmFuc2Zvcm06IHNjYWxlKDApOyB9CiAgICA0MCUgeyB0cmFuc2Zvcm06IHNjYWxlKDEpOyB9CiAgfQoKICBAbWVkaWEgKG1heC13aWR0aDogNjAwcHgpIHsKICAgIC5hcHAgeyBwYWRkaW5nOiAxLjI1cmVtIDFyZW0gM3JlbTsgfQogICAgLmhlYWRlciBoMSB7IGZvbnQtc2l6ZTogMS4zcmVtOyB9CiAgICAuaW5wdXQtd3JhcHBlciB7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IH0KICAgIC5zZW5kLWJ0biB7IHBhZGRpbmc6IDAuODVyZW07IGp1c3RpZnktY29udGVudDogY2VudGVyOyBib3JkZXItcmFkaXVzOiAxMHB4OyB9CiAgICAucmVzdWx0LWhlYWRlciB7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0OyBnYXA6IDAuNXJlbTsgfQogICAgLmV4YW1wbGVzIHsgZ2FwOiAwLjRyZW07IH0KICAgIC5leGFtcGxlLWNoaXAgeyBmb250LXNpemU6IDAuNzJyZW07IHBhZGRpbmc6IDAuMzVyZW0gMC42NXJlbTsgfQogIH0KPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KCjxkaXYgY2xhc3M9ImFwcCI+CiAgPGRpdiBjbGFzcz0iaGVhZGVyIj4KICAgIDxkaXYgY2xhc3M9ImxvZ28iPuKaoTwvZGl2PgogICAgPGgxPjxzcGFuPk5hdHVyYWw8L3NwYW4+IEdhdGU8L2gxPgogIDwvZGl2PgogIDxwIGNsYXNzPSJ0YWdsaW5lIj5Bc2sgYWJvdXQgb3VyIGNhciBmbGVldCBpbiBuYXR1cmFsIGxhbmd1YWdlPC9wPgoKICA8ZGl2IGNsYXNzPSJpbnB1dC1zZWN0aW9uIj4KICAgIDxkaXYgY2xhc3M9ImlucHV0LXdyYXBwZXIiPgogICAgICA8aW5wdXQgdHlwZT0idGV4dCIgY2xhc3M9InF1ZXJ5LWlucHV0IiBpZD0icXVlcnlJbnB1dCIKICAgICAgICBwbGFjZWhvbGRlcj0nVHJ5OiAic2hvdyBtZSBhdmFpbGFibGUgU1VWcyBpbiBWYWxlbmNpYSInCiAgICAgICAgYXV0b2NvbXBsZXRlPSJvZmYiIHNwZWxsY2hlY2s9ImZhbHNlIj4KICAgICAgPGJ1dHRvbiBjbGFzcz0ic2VuZC1idG4iIGlkPSJzZW5kQnRuIiBvbmNsaWNrPSJzZW5kUXVlcnkoKSI+CiAgICAgICAgPHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMjIiIHkxPSIyIiB4Mj0iMTEiIHkyPSIxMyIvPjxwb2x5Z29uIHBvaW50cz0iMjIgMiAxNSAyMiAxMSAxMyAyIDkgMjIgMiIvPjwvc3ZnPgogICAgICAgIFNlbmQKICAgICAgPC9idXR0b24+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJvcHRpb25zLXJvdyI+CiAgICAgIDxsYWJlbCBjbGFzcz0ib3B0aW9uLXRvZ2dsZSIgb25jbGljaz0idG9nZ2xlRXhwbGFpbigpIj4KICAgICAgICA8ZGl2IGNsYXNzPSJ0b2dnbGUtdHJhY2siIGlkPSJleHBsYWluVG9nZ2xlIj4KICAgICAgICAgIDxkaXYgY2xhc3M9InRvZ2dsZS10aHVtYiI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgQUkgU3VtbWFyeQogICAgICA8L2xhYmVsPgogICAgPC9kaXY+CiAgPC9kaXY+CgogIDxkaXYgY2xhc3M9ImV4YW1wbGVzIj4KICAgIDxzcGFuIGNsYXNzPSJleGFtcGxlcy1sYWJlbCI+VHJ5IHRoZXNlPC9zcGFuPgogICAgPHNwYW4gY2xhc3M9ImV4YW1wbGUtY2hpcCIgb25jbGljaz0idHJ5RXhhbXBsZSh0aGlzKSI+c2hvdyBtZSBhdmFpbGFibGUgU1VWcyBpbiBWYWxlbmNpYTwvc3Bhbj4KICAgIDxzcGFuIGNsYXNzPSJleGFtcGxlLWNoaXAiIG9uY2xpY2s9InRyeUV4YW1wbGUodGhpcykiPmxpc3QgQk1XcyB1bmRlciA4MCBldXJvcyBwZXIgZGF5PC9zcGFuPgogICAgPHNwYW4gY2xhc3M9ImV4YW1wbGUtY2hpcCIgb25jbGljaz0idHJ5RXhhbXBsZSh0aGlzKSI+aG93IG1hbnkgcmVzZXJ2YXRpb25zIGRvIHdlIGhhdmU/PC9zcGFuPgogICAgPHNwYW4gY2xhc3M9ImV4YW1wbGUtY2hpcCIgb25jbGljaz0idHJ5RXhhbXBsZSh0aGlzKSI+ZmluZCByZXNlcnZhdGlvbiBmb3IgbWFyaWE8L3NwYW4+CiAgICA8c3BhbiBjbGFzcz0iZXhhbXBsZS1jaGlwIiBvbmNsaWNrPSJ0cnlFeGFtcGxlKHRoaXMpIj5jYW5jZWwgcmVzZXJ2YXRpb24gUkVTLUExQjJDMzwvc3Bhbj4KICAgIDxzcGFuIGNsYXNzPSJleGFtcGxlLWNoaXAiIG9uY2xpY2s9InRyeUV4YW1wbGUodGhpcykiPnNob3cgbWUgZWxlY3RyaWMgY2Fyczwvc3Bhbj4KICAgIDxzcGFuIGNsYXNzPSJleGFtcGxlLWNoaXAiIG9uY2xpY2s9InRyeUV4YW1wbGUodGhpcykiPndoYXQgaXMgb3VyIHRvdGFsIHJldmVudWU/PC9zcGFuPgogIDwvZGl2PgoKICA8ZGl2IGNsYXNzPSJyZXN1bHRzLWFyZWEiIGlkPSJyZXN1bHRzIj48L2Rpdj4KPC9kaXY+Cgo8c2NyaXB0PgogIGNvbnN0IEdBVEVXQVlfVVJMID0gImh0dHBzOi8vbmF0dXJhbGdhdGUucnViZW5iLXNpZ25hdHVyaXQud29ya2Vycy5kZXYiOwogIGxldCBleHBsYWluRW5hYmxlZCA9IGZhbHNlOwoKICBmdW5jdGlvbiB0b2dnbGVFeHBsYWluKCkgewogICAgZXhwbGFpbkVuYWJsZWQgPSAhZXhwbGFpbkVuYWJsZWQ7CiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXhwbGFpblRvZ2dsZScpLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScsIGV4cGxhaW5FbmFibGVkKTsKICB9CgogIGZ1bmN0aW9uIHRyeUV4YW1wbGUoZWwpIHsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdxdWVyeUlucHV0JykudmFsdWUgPSBlbC50ZXh0Q29udGVudDsKICAgIHNlbmRRdWVyeSgpOwogIH0KCiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3F1ZXJ5SW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHsKICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykgc2VuZFF1ZXJ5KCk7CiAgfSk7CgogIGFzeW5jIGZ1bmN0aW9uIHNlbmRRdWVyeSgpIHsKICAgIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3F1ZXJ5SW5wdXQnKTsKICAgIGNvbnN0IHF1ZXJ5ID0gaW5wdXQudmFsdWUudHJpbSgpOwogICAgaWYgKCFxdWVyeSkgcmV0dXJuOwoKICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZW5kQnRuJyk7CiAgICBidG4uZGlzYWJsZWQgPSB0cnVlOwogICAgY29uc3QgcmVzdWx0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzJyk7CgogICAgY29uc3QgbG9hZGluZ0lkID0gJ2xvYWRpbmctJyArIERhdGUubm93KCk7CiAgICByZXN1bHRzLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGAKICAgICAgPGRpdiBjbGFzcz0ibG9hZGluZy1jYXJkIiBpZD0iJHtsb2FkaW5nSWR9Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJsb2FkaW5nLWRvdHMiPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjwvZGl2PgogICAgICAgIDxzcGFuIGNsYXNzPSJsb2FkaW5nLXRleHQiPlRyYW5zbGF0aW5nICIke3F1ZXJ5fSIg4oCmPC9zcGFuPgogICAgICA8L2Rpdj4KICAgIGApOwoKICAgIHRyeSB7CiAgICAgIGNvbnN0IHVybCA9IGAke0dBVEVXQVlfVVJMfS9hc2ske2V4cGxhaW5FbmFibGVkID8gJz9leHBsYWluPXRydWUnIDogJyd9YDsKICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHsKICAgICAgICBtZXRob2Q6ICdQT1NUJywKICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSwKICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHF1ZXJ5IH0pLAogICAgICB9KTsKCiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7CgogICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsb2FkaW5nSWQpPy5yZW1vdmUoKTsKCiAgICAgIGlmIChkYXRhLmVycm9yKSB7CiAgICAgICAgcmVzdWx0cy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBgCiAgICAgICAgICA8ZGl2IGNsYXNzPSJlcnJvci1jYXJkIj7imqAgJHtlc2NhcGVIdG1sKGRhdGEuZXJyb3IpfSR7ZGF0YS5zdWdnZXN0aW9uID8gJzxicj48c21hbGw+JyArIGVzY2FwZUh0bWwoZGF0YS5zdWdnZXN0aW9uKSArICc8L3NtYWxsPicgOiAnJ308L2Rpdj4KICAgICAgICBgKTsKICAgICAgfSBlbHNlIHsKICAgICAgICBjb25zdCB0cmFuc2xhdGVkID0gZGF0YS50cmFuc2xhdGVkX3RvCiAgICAgICAgICA/IGAke2RhdGEudHJhbnNsYXRlZF90by5tZXRob2R9ICR7ZGF0YS50cmFuc2xhdGVkX3RvLnBhdGh9YAogICAgICAgICAgOiAnJzsKICAgICAgICBjb25zdCBlbGFwc2VkID0gZGF0YS5tZXRhPy5lbGFwc2VkX21zID8gYCR7ZGF0YS5tZXRhLmVsYXBzZWRfbXN9bXNgIDogJyc7CgogICAgICAgIGxldCBodG1sID0gYDxkaXYgY2xhc3M9InJlc3VsdC1jYXJkIj4KICAgICAgICAgIDxkaXYgY2xhc3M9InJlc3VsdC1oZWFkZXIiPgogICAgICAgICAgICA8c3BhbiBjbGFzcz0icmVzdWx0LXF1ZXJ5Ij4iJHtlc2NhcGVIdG1sKHF1ZXJ5KX0iPC9zcGFuPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJyZXN1bHQtbWV0YSI+CiAgICAgICAgICAgICAgJHtlbGFwc2VkID8gYDxzcGFuPuKPsSAke2VsYXBzZWR9PC9zcGFuPmAgOiAnJ30KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8L2Rpdj5gOwoKICAgICAgICBpZiAodHJhbnNsYXRlZCkgewogICAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz0idHJhbnNsYXRpb24tcm93Ij4KICAgICAgICAgICAgPHNwYW4gY2xhc3M9ImFycm93Ij7ihpI8L3NwYW4+CiAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJtZXRob2QtYmFkZ2UiPiR7ZXNjYXBlSHRtbChkYXRhLnRyYW5zbGF0ZWRfdG8ubWV0aG9kKX08L3NwYW4+CiAgICAgICAgICAgIDxzcGFuPiR7ZXNjYXBlSHRtbChkYXRhLnRyYW5zbGF0ZWRfdG8ucGF0aCl9PC9zcGFuPgogICAgICAgICAgPC9kaXY+YDsKICAgICAgICB9CgogICAgICAgIGh0bWwgKz0gYDxkaXYgY2xhc3M9InJlc3VsdC1ib2R5Ij48cHJlPiR7c3ludGF4SGlnaGxpZ2h0KGRhdGEuZGF0YSl9PC9wcmU+PC9kaXY+YDsKCiAgICAgICAgaWYgKGRhdGEuc3VtbWFyeSkgewogICAgICAgICAgaHRtbCArPSBgPGRpdiBjbGFzcz0ic3VtbWFyeS1zZWN0aW9uIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0ic3VtbWFyeS1sYWJlbCI+QUkgU3VtbWFyeTwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJzdW1tYXJ5LXRleHQiPiR7ZXNjYXBlSHRtbChkYXRhLnN1bW1hcnkpfTwvZGl2PgogICAgICAgICAgPC9kaXY+YDsKICAgICAgICB9CgogICAgICAgIGh0bWwgKz0gYDwvZGl2PmA7CiAgICAgICAgcmVzdWx0cy5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBodG1sKTsKICAgICAgfQogICAgfSBjYXRjaCAoZXJyKSB7CiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGxvYWRpbmdJZCk/LnJlbW92ZSgpOwogICAgICByZXN1bHRzLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGAKICAgICAgICA8ZGl2IGNsYXNzPSJlcnJvci1jYXJkIj4KICAgICAgICAgIOKaoCBDb3VsZCBub3QgcmVhY2ggZ2F0ZXdheSBhdCA8c3Ryb25nPiR7ZXNjYXBlSHRtbChHQVRFV0FZX1VSTCl9PC9zdHJvbmc+PGJyPgogICAgICAgICAgPHNtYWxsPk1ha2Ugc3VyZSB0aGUgV29ya2VyIGlzIGRlcGxveWVkIGFuZCB0aGUgdHVubmVsIGlzIHJ1bm5pbmcuPC9zbWFsbD4KICAgICAgICA8L2Rpdj4KICAgICAgYCk7CiAgICB9CgogICAgYnRuLmRpc2FibGVkID0gZmFsc2U7CiAgICBpbnB1dC5mb2N1cygpOwogIH0KCiAgZnVuY3Rpb24gZXNjYXBlSHRtbChzdHIpIHsKICAgIGNvbnN0IGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGQudGV4dENvbnRlbnQgPSBzdHI7CiAgICByZXR1cm4gZC5pbm5lckhUTUw7CiAgfQoKICBmdW5jdGlvbiBzeW50YXhIaWdobGlnaHQob2JqKSB7CiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkob2JqLCBudWxsLCAyKTsKICAgIHJldHVybiBqc29uLnJlcGxhY2UoLygiKFxcdVthLXpBLVowLTldezR9fFxcW151XXxbXlxcIl0pKiIoXHMqOik/fFxiKHRydWV8ZmFsc2V8bnVsbClcYnwtP1xkKyg/OlwuXGQqKT8oPzpbZUVdWytcLV0/XGQrKT8pL2csIChtYXRjaCkgPT4gewogICAgICBsZXQgY2xzID0gJ251bWJlcic7CiAgICAgIGlmICgvXiIvLnRlc3QobWF0Y2gpKSB7CiAgICAgICAgY2xzID0gLzokLy50ZXN0KG1hdGNoKSA/ICdrZXknIDogJ3N0cmluZyc7CiAgICAgIH0gZWxzZSBpZiAoL3RydWV8ZmFsc2UvLnRlc3QobWF0Y2gpKSB7CiAgICAgICAgY2xzID0gJ2Jvb2xlYW4nOwogICAgICB9IGVsc2UgaWYgKC9udWxsLy50ZXN0KG1hdGNoKSkgewogICAgICAgIGNscyA9ICdudWxsJzsKICAgICAgfQogICAgICBjb25zdCBjb2xvcnMgPSB7CiAgICAgICAga2V5OiAnI0Y2ODIxRicsCiAgICAgICAgc3RyaW5nOiAnIzA4OTFCMicsCiAgICAgICAgbnVtYmVyOiAnIzEwQjk4MScsCiAgICAgICAgYm9vbGVhbjogJyNBNzhCRkEnLAogICAgICAgIG51bGw6ICcjRUY0NDQ0JywKICAgICAgfTsKICAgICAgcmV0dXJuIGA8c3BhbiBzdHlsZT0iY29sb3I6JHtjb2xvcnNbY2xzXX0iPiR7bWF0Y2h9PC9zcGFuPmA7CiAgICB9KTsKICB9Cjwvc2NyaXB0PgoKPC9ib2R5Pgo8L2h0bWw+Cg==");

// ─── Config ─────────────────────────────────────────────────────────────────

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const BACKEND_TIMEOUT_MS = 8000;
const SPEC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── In-memory caches (per-request, Workerisolate lifetime) ─────────────────

let specCache = null;
let specCacheAt = 0;

// Simple in-memory translation cache to avoid duplicate AI calls
const translationCache = new Map();
const TRANSLATION_CACHE_MAX = 100;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = BACKEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Backend fetch — uses VPC binding if available, otherwise BACKEND_URL env var
async function backendFetch(env, path, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const opts = { ...options, signal: controller.signal };
    if (env.BACKEND_VPC) {
      const url = new URL(path, "http://localhost:8080");
      return await env.BACKEND_VPC.fetch(url.toString(), opts);
    }
    const url = new URL(path, env.BACKEND_URL);
    return await fetch(url.toString(), opts);
  } finally {
    clearTimeout(id);
  }
}

// ─── API Spec (cached with TTL) ─────────────────────────────────────────────

async function getApiSpec(env) {
  const now = Date.now();
  if (specCache && now - specCacheAt < SPEC_CACHE_TTL_MS) {
    return specCache;
  }
  try {
    const res = await backendFetch(env, "/api/spec");
    if (!res.ok) throw new Error(`Backend spec returned ${res.status}`);
    specCache = await res.json();
    specCacheAt = now;
    return specCache;
  } catch (err) {
    console.error("Failed to fetch API spec:", err.message);
    return specCache; // fallback to stale cache
  }
}

// ─── Workers AI ─────────────────────────────────────────────────────────────

async function askAI(ai, prompt, systemPrompt) {
  const response = await ai.run(AI_MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });

  if (!response || !response.response) {
    throw new Error("Workers AI returned an empty response");
  }

  return response.response;
}

// ─── Robust JSON extraction ─────────────────────────────────────────────────

function extractJson(text) {
  // Ensure the AI response is a string before processing
  text = typeof text === "string" ? text : String(text);
  // Try to find the outermost JSON object or array
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
      continue;
    }
  }

  // Fallback: strip markdown fences and try the whole string
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    return cleaned;
  }

  return null;
}

// ─── Translation cache key ──────────────────────────────────────────────────

function cacheKey(query, spec) {
  // Simple hash of query + endpoint count
  const specHash = spec.endpoints.length;
  return `${query.toLowerCase().trim()}|${specHash}`;
}

// ─── Natural language → API call translation ────────────────────────────────

async function translateQuery(ai, query, spec) {
  const cacheKeyValue = cacheKey(query, spec);
  if (translationCache.has(cacheKeyValue)) {
    return translationCache.get(cacheKeyValue);
  }

  const systemPrompt = `You are an API routing engine for a car rental e-commerce platform called "Natural Coches".

Your job: translate the user's natural-language query into a single backend API call.

AVAILABLE ENDPOINTS:
${JSON.stringify(spec.endpoints, null, 2)}

DOMAIN CONTEXT:
- This is a car rental system with cars, reservations, payments, and statistics.
- Cars have: brand, model, type (Sedán, Compacto, SUV, Furgoneta), fuel, transmission, location (Valencia, Madrid, Barcelona), price_per_day, available.
- Reservations have: id, car_id, customer_name, email, status (confirmada, en_curso, completada, cancelada), payment_status (pending, paid), total_price.
- Stats endpoint returns aggregated data: total_cars, available_cars, total_reservations, active_reservations, total_revenue, avg_reservation_value.

RULES:
1. Respond ONLY with a JSON object. No markdown, no explanation, no preamble.
2. Format: {"method": "GET|POST", "path": "/api/...", "query": {...}, "body": {...}}
   - Use "query" for GET parameters (they become URL query string)
   - Use "body" for POST request payloads
3. If the query clearly does not match any endpoint, respond: {"error": "No matching endpoint found"}
4. Infer filters from context. Examples:
   - "SUVs available in Valencia" → {"method":"GET","path":"/api/cars","query":{"type":"SUV","location":"Valencia"}}
   - "show me electric cars" → {"method":"GET","path":"/api/cars","query":{"type":"Sedán"}} (best match)
   - "how much revenue do we have?" → {"method":"GET","path":"/api/stats"}
   - "cancel reservation ABC123" → {"method":"POST","path":"/api/reservations/ABC123/cancel"}
   - "find reservation for maria" → {"method":"GET","path":"/api/reservations/search","query":{"q":"maria"}}
   - "book a BMW for Juan" → {"method":"POST","path":"/api/reservations","body":{"car_id":1,"customer_name":"Juan",...}}
5. Understand Spanish, English, and Valencian.
6. If vague, pick the most reasonable endpoint.
7. Today's date is ${new Date().toISOString().split("T")[0]}`;

  const raw = await askAI(ai, query, systemPrompt);
  const candidate = extractJson(raw);

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return { error: "Failed to parse AI response", raw };
  }

  // Store in cache
  if (translationCache.size >= TRANSLATION_CACHE_MAX) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(cacheKeyValue, parsed);

  return parsed;
}

// ─── Response formatting ────────────────────────────────────────────────────

async function formatResponse(ai, query, data) {
  const systemPrompt = `You are a helpful, friendly car rental assistant. The user asked a natural-language question and the backend returned data.

Your task: summarize the results in the SAME LANGUAGE the user asked. Be concise (2-3 sentences). Focus on the key takeaway — do not list every raw field unless specifically asked. If the data is a list, mention the count and a highlight. If it's a single object, mention the main detail.`;

  const prompt = `User asked: "${query}"
Backend returned: ${JSON.stringify(data).slice(0, 4000)}

Please provide a brief, friendly summary.`;

  return askAI(ai, prompt, systemPrompt);
}

// ─── Request handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders();

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ─── Route: GET / ───
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(FRONTEND_HTML, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    // ─── Route: GET /health ───
    if (url.pathname === "/health") {
      try {
        const res = await backendFetch(env, "/api/stats");
        const backend = res.ok ? "ok" : `error_${res.status}`;
        return Response.json(
          { gateway: "ok", backend, timestamp: new Date().toISOString() },
          { headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { gateway: "ok", backend: "unreachable", error: err.message },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    // ─── Route: POST /ask ───
    if (url.pathname === "/ask" && request.method === "POST") {
      const startTime = Date.now();

      try {
        let body;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Invalid JSON body" },
            { status: 400, headers: corsHeaders }
          );
        }

        const query = body.query;
        if (!query || typeof query !== "string" || query.trim().length === 0) {
          return Response.json(
            { error: "Missing 'query' field. Send: {\"query\": \"your question\"}" },
            { status: 400, headers: corsHeaders }
          );
        }

        const explain = url.searchParams.get("explain") === "true";

        // 1. Get API spec
        const spec = await getApiSpec(env);
        if (!spec) {
          const backendUrl = env.BACKEND_VPC ? "(via VPC tunnel)" : env.BACKEND_URL || "(not set)";
          return Response.json(
            {
              error: "Could not fetch backend API spec",
              detail: `Worker tried to reach the backend at ${backendUrl} but failed.`,
              solutions: [
                "Ensure cloudflared tunnel is running with: sudo systemctl status cloudflared",
                "Set BACKEND_URL in wrangler.toml or configure VPC binding",
              ],
            },
            { status: 502, headers: corsHeaders }
          );
        }

        // 2. Translate query
        const translation = await translateQuery(env.AI, query, spec);

        if (translation.error) {
          return Response.json(
            {
              error: translation.error,
              suggestion: "Try rephrasing your query. Examples: 'show me SUVs', 'how many reservations', 'get stats'.",
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // 3. Build request
        const method = translation.method || "GET";
        let path = translation.path;
        const fetchOpts = { method };

        if (translation.query && Object.keys(translation.query).length > 0) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(translation.query)) {
            qs.append(k, String(v));
          }
          path += `?${qs.toString()}`;
        }

        if (translation.body && Object.keys(translation.body).length > 0) {
          fetchOpts.headers = { "Content-Type": "application/json" };
          fetchOpts.body = JSON.stringify(translation.body);
        }

        // 4. Call backend
        const backendRes = await backendFetch(env, path, fetchOpts);

        let data;
        const contentType = backendRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await backendRes.json();
        } else {
          data = { raw: await backendRes.text() };
        }

        if (!backendRes.ok) {
          return Response.json(
            {
              error: `Backend returned ${backendRes.status}`,
              translated_to: { method, path: translation.path, query: translation.query, body: translation.body },
              backend_response: data,
            },
            { status: backendRes.status, headers: corsHeaders }
          );
        }

        // 5. Optionally summarize with AI
        let summary = null;
        if (explain) {
          try {
            summary = await formatResponse(env.AI, query, data);
          } catch (err) {
            console.error("Formatting failed:", err.message);
            summary = null;
          }
        }

        // 6. Build response
        const elapsed = Date.now() - startTime;
        const response = {
          query,
          translated_to: {
            method,
            path: translation.path,
            query: translation.query || null,
            body: translation.body || null,
          },
          data,
          ...(summary && { summary }),
          meta: {
            elapsed_ms: elapsed,
            gateway: "natural-gate-v1",
            ai_model: AI_MODEL,
            timestamp: new Date().toISOString(),
          },
        };

        return Response.json(response, { headers: corsHeaders });
      } catch (err) {
        console.error("Gateway error:", err.stack || err.message);
        return Response.json(
          { error: "Gateway error", details: err.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ─── Fallback: proxy any /api/* to backend ───
    if (url.pathname.startsWith("/api/")) {
      try {
        const backendRes = await backendFetch(
          env,
          `${url.pathname}${url.search}`,
          {
            method: request.method,
            headers: request.headers,
            body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
          }
        );

        const contentType = backendRes.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
          data = await backendRes.json();
        } else {
          data = await backendRes.text();
        }

        return new Response(
          typeof data === "string" ? data : JSON.stringify(data),
          {
            status: backendRes.status,
            headers: {
              ...corsHeaders,
              "content-type": contentType || "application/json",
            },
          }
        );
      } catch (err) {
        return Response.json(
          { error: "Backend unreachable", details: err.message },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    return Response.json(
      { error: "Not found. Try POST /ask or GET /health" },
      { status: 404, headers: corsHeaders }
    );
  },
};
