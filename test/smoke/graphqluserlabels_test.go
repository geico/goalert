package smoke

import (
	"fmt"
	"testing"

	"github.com/target/goalert/test/smoke/harness"
)

// TestGraphQLUserLabels tests that labels for users can be created,
// edited and deleted using the GraphQL API.

func TestGraphQLUserLabels(t *testing.T) {
	t.Parallel()

	// Insert initial user and label into db
	const sql = `
	insert into users (id, name, email) 
	values
		({{uuid "uid"}}, 'test user', 'test@example.com');

	insert into labels (id, tgt_user_id, key, value) 
	values
		('1', {{uuid "uid"}}, 'team/department', 'engineering');
`

	h := harness.NewHarness(t, sql, "user-labels")
	defer h.Close()

	doQL := func(query string) {
		g := h.GraphQLQuery2(query)
		for _, err := range g.Errors {
			t.Error("GraphQL Error:", err.Message)
		}
		if len(g.Errors) > 0 {
			t.Fatal("errors returned from GraphQL")
		}
		t.Log("Response:", string(g.Data))
	}

	// Test querying user labels
	doQL(fmt.Sprintf(`
		query {
			user(id: "%s") {
				id
				name
				labels {
					key
					value
				}
			}
		}
	`, h.UUID("uid")))

	// Edit label
	doQL(fmt.Sprintf(`
		mutation {
			setLabel(input:{ target: {type: user , id: "%s"}, key: "%s", value: "%s" }) 
		}
	`, h.UUID("uid"), "team/department", "devops"))

	// Test querying updated label
	doQL(fmt.Sprintf(`
		query {
			user(id: "%s") {
				labels {
					key
					value
				}
			}
		}
	`, h.UUID("uid")))

	// Add a new label
	doQL(fmt.Sprintf(`
		mutation {
			setLabel(input:{ target: {type: user , id: "%s"}, key: "%s", value: "%s" }) 
		}
	`, h.UUID("uid"), "org/team", "backend"))

	// Test querying both labels
	doQL(fmt.Sprintf(`
		query {
			user(id: "%s") {
				labels {
					key
					value
				}
			}
		}
	`, h.UUID("uid")))

	// Delete label
	doQL(fmt.Sprintf(`
		mutation {
			setLabel(input:{ target: {type: user , id: "%s"}, key: "%s", value: "%s" }) 
		}
	`, h.UUID("uid"), "team/department", ""))

	// Test that label was deleted
	doQL(fmt.Sprintf(`
		query {
			user(id: "%s") {
				labels {
					key
					value
				}
			}
		}
	`, h.UUID("uid")))
}
