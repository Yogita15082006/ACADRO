import psycopg2
conn = psycopg2.connect(dbname='acronexus', user='postgres', password='password', host='localhost')
cur = conn.cursor()
cur.execute('SELECT e.title, e.event_date FROM events e')
print('Events:', cur.fetchall())
cur.execute('SELECT event_id, batch_year, acro_class_id, is_entire_batch FROM event_target_assignments')
print('Targets:', cur.fetchall())
