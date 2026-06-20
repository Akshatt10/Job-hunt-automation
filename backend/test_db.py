from database import engine, get_session
from sqlmodel import Session, select, func
from models import Contact
with Session(engine) as session:
    user_id = 1
    contact_filter = "pending"
    query = select(func.count(Contact.id)).where(Contact.user_id == user_id, Contact.status == contact_filter)
    total = session.exec(query).one()
    print("COUNT:", total)
    
    # What if we just select all?
    all_pending = session.exec(select(Contact).where(Contact.status == "pending")).all()
    print("ALL PENDING COUNT:", len(all_pending))
    for c in all_pending:
        print(c.user_id, c.status)
