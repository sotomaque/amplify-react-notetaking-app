import React from 'react';
import { withAuthenticator } from 'aws-amplify-react';
import { API, graphqlOperation } from 'aws-amplify';
import { updateNote, deleteNote, createNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions';

const App = () => {
  const [id, setId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [notes, setNotes] = React.useState([]);

  React.useEffect(() => {
    getNotes();

    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        setNotes(prevNotes => {
          const oldNotes = prevNotes.filter(note => note.id !== newNote.id)
          const updatedNotes = [...oldNotes, newNote]
          return updatedNotes;
        })
        setNote('');
      }
    });


    const deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        setNotes(prevNotes => {
          const updatedNotes = prevNotes.filter(note => 
            note.id !== deletedNote.id)
          return updatedNotes;
        })
      }
    });


    const updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        setNotes(prevNotes => {
          const index = prevNotes.findIndex(note => note.id === updatedNote.id);
          const updatedNotes = [
            ...prevNotes.slice(0, index),
            updatedNote,
            ...prevNotes.slice(index + 1)
          ];
          return updatedNotes
        })
        setNote(''); 
        setId('');
      }
    });

    //clean up section
    return () => {
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    }
  }, []);

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  }

  const handleChangeNote = event => {
    setNote(event.target.value)
  }

  const hasExistingNote = () => {
    if (id) {
      const isNote = notes.findIndex(note => note.id === id) > -1;
      return isNote
    }
    return false;
  };

  const handleSetNote = ({ note, id }) => {
    setNote(note);
    setId(id);
  };

  const handleDeleteNote = async noteId => {
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));
  };

  const handleUpdateNote = async () => {
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
  };

  const handleAddNote = async event => {
    event.preventDefault();
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
    }
  };

  return (
    <div className="vh-100 code flex flex-column items-center bg-purple white pa3 fl-1">
      <h1 className="f2-l">Amplify GraphQL Checklist 
        <span role="img" aria-label="Checkmark">✅</span>
      </h1>
      
      {/* notes form */}
      <form className="mb3" onSubmit={handleAddNote}>
        <input 
          className="pa2 f4 b--dashed" 
          type="text" 
          placeholder="Write a Note" 
          value={note}
          onChange={handleChangeNote} />
        <button className="pa2 f4 bg-green" type="submit">Add Note</button>
      </form>

      {/* notes list */}
      <div>
        {
          notes.map(item => (
            <div key={item.id} className="flex items-center">
              <li 
                className="list pa1 f3" 
                onClick={() => handleSetNote(item)}
              >
                {item.note}
              </li>
              <button 
                className="bg-transparent bn f4"
                onClick={() => handleDeleteNote(item.id)}
              >
                <span className="red">&times;</span>
              </button>
            </div>
          ) )
        }
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
