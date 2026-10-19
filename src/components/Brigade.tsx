import PetAvatar from './PetAvatar';

const CREW = [
  ['pepe', 'Pepe', 'Quartermaster of tea', 'Serves a calming brew mid-charge. Rioters keep stopping for a sip, then forget why they were angry.'],
  ['gigachad', 'Gigachad', 'Head of baguette lifting', 'Raises one baguette. Nine rioters reconsider their life choices and a nearby wall.'],
  ['wojak', 'Wojak', 'Weapons-grade feelings', 'Weeps openly at the mob until they feel so guilty they apologise and go home.'],
  ['trollface', 'Trollface', 'Minister of street signs', 'Swapped every sign on the rue. The mob has been charging a bakery since Tuesday.'],
] as const;

// Pierre and the memes who back him up. Pure flavour text.
export default function Brigade() {
  return (
    <section className="brigade card" aria-label="Pierre and the meme brigade">
      <div className="brigade-hero">
        <PetAvatar id="pierre" name="Pierre" size={132} />
        <div>
          <p className="eyebrow mono">Hero of the last barricade</p>
          <h2>Pierre holds the line</h2>
          <p className="muted">
            One tall, calm man in a black t-shirt stands in the middle of the rue while a vicious mob charges him. He has not raised his voice once. He does not need to. He has the memes.
          </p>
        </div>
      </div>
      <ul className="crew">
        {CREW.map(([id, name, role, how]) => (
          <li key={id}>
            <PetAvatar id={id} name={name} size={48} />
            <div>
              <b>{name}</b> <span className="tag">{role}</span>
              <p className="muted small">{how}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="muted small">Pierre is an original cartoon character, and so is the mob. Nobody gets hurt, only baguette-bonked.</p>
    </section>
  );
}
