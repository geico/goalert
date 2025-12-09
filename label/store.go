package label

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/target/goalert/assignment"
	"github.com/target/goalert/gadb"
	"github.com/target/goalert/permission"
	"github.com/target/goalert/validation/validate"

	"github.com/pkg/errors"
)

// Store allows the lookup and management of Labels.
type Store struct {
	db *sql.DB
}

// NewStore will Set a DB backend from a sql.DB. An error will be returned if statements fail to prepare.
func NewStore(ctx context.Context, db *sql.DB) (*Store, error) { return &Store{db: db}, nil }

// SetTx will set a label for the service or user. It can be used to set the key-value pair for the label,
// delete a label or update the value given the label's key.
func (s *Store) SetTx(ctx context.Context, db gadb.DBTX, label *Label) error {
	err := permission.LimitCheckAny(ctx, permission.System, permission.User)
	if err != nil {
		return err
	}

	n, err := label.Normalize()
	if err != nil {
		return err
	}

	if n.Value == "" { // delete if value is empty
		if n.Target.TargetType() == assignment.TargetTypeService {
			_, err = db.ExecContext(ctx, `DELETE FROM labels WHERE key = $1 AND tgt_service_id = $2`,
				label.Key, uuid.MustParse(label.Target.TargetID()))
			if err != nil {
				return fmt.Errorf("delete service label: %w", err)
			}
		} else if n.Target.TargetType() == assignment.TargetTypeUser {
			_, err = db.ExecContext(ctx, `DELETE FROM labels WHERE key = $1 AND tgt_user_id = $2`,
				label.Key, uuid.MustParse(label.Target.TargetID()))
			if err != nil {
				return fmt.Errorf("delete user label: %w", err)
			}
		} else {
			return fmt.Errorf("unsupported target type for label: %s", n.Target.TargetType())
		}
		return nil
	}

	if n.Target.TargetType() == assignment.TargetTypeService {
		_, err = db.ExecContext(ctx, `INSERT INTO labels(key, value, tgt_service_id) VALUES ($1, $2, $3)
			ON CONFLICT (key, tgt_service_id) DO UPDATE SET value = $2`,
			label.Key, label.Value, uuid.MustParse(label.Target.TargetID()))
		if err != nil {
			return fmt.Errorf("set service label: %w", err)
		}
	} else if n.Target.TargetType() == assignment.TargetTypeUser {
		_, err = db.ExecContext(ctx, `INSERT INTO labels(key, value, tgt_user_id) VALUES ($1, $2, $3)
			ON CONFLICT (key, tgt_user_id) DO UPDATE SET value = $2`,
			label.Key, label.Value, uuid.MustParse(label.Target.TargetID()))
		if err != nil {
			return fmt.Errorf("set user label: %w", err)
		}
	} else {
		return fmt.Errorf("unsupported target type for label: %s", n.Target.TargetType())
	}

	return nil
}

// FindAllByService finds all labels for a particular service. It returns all key-value pairs.
func (s *Store) FindAllByService(ctx context.Context, db gadb.DBTX, serviceID string) ([]Label, error) {
	err := permission.LimitCheckAny(ctx, permission.System, permission.User)
	if err != nil {
		return nil, err
	}

	svc, err := validate.ParseUUID("ServiceID", serviceID)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(ctx, `SELECT key, value FROM labels WHERE tgt_service_id = $1`, svc)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find all labels by service: %w", err)
	}
	defer rows.Close()

	var labels []Label
	for rows.Next() {
		var l Label
		err = rows.Scan(&l.Key, &l.Value)
		if err != nil {
			return nil, fmt.Errorf("scan service label: %w", err)
		}
		l.Target = assignment.ServiceTarget(serviceID)
		labels = append(labels, l)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate service labels: %w", err)
	}

	return labels, nil
}

// FindAllByUser finds all labels for a particular user. It returns all key-value pairs.
func (s *Store) FindAllByUser(ctx context.Context, db gadb.DBTX, userID string) ([]Label, error) {
	err := permission.LimitCheckAny(ctx, permission.System, permission.User)
	if err != nil {
		return nil, err
	}

	usr, err := validate.ParseUUID("UserID", userID)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(ctx, `SELECT key, value FROM labels WHERE tgt_user_id = $1`, usr)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find all labels by user: %w", err)
	}
	defer rows.Close()

	var labels []Label
	for rows.Next() {
		var l Label
		err = rows.Scan(&l.Key, &l.Value)
		if err != nil {
			return nil, fmt.Errorf("scan user label: %w", err)
		}
		l.Target = assignment.UserTarget(userID)
		labels = append(labels, l)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate user labels: %w", err)
	}

	return labels, nil
}

func (s *Store) UniqueKeysTx(ctx context.Context, db gadb.DBTX) ([]string, error) {
	err := permission.LimitCheckAny(ctx, permission.System, permission.User)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(ctx, `SELECT DISTINCT key FROM labels`)
	if err != nil {
		return nil, fmt.Errorf("get unique label keys: %w", err)
	}
	defer rows.Close()

	var keys []string
	for rows.Next() {
		var key string
		err = rows.Scan(&key)
		if err != nil {
			return nil, fmt.Errorf("scan label key: %w", err)
		}
		keys = append(keys, key)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate label keys: %w", err)
	}

	return keys, nil
}
