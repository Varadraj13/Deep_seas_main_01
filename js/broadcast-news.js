// News registry for the broadcast console.
// Each weapon maps to: alert (chyron title), sat (image filename),
// angles[4] in order: [direct impact, economic, geopolitical, human].
const BROADCAST_NEWS = {
  D01:{alert:'STRAIT SEALED', sat:'D01_strait_closure.jpg', angles:[
    'Naval forces have sealed the Strait of Hormuz to commercial traffic, halting transits at the world’s busiest oil chokepoint.',
    'Brent crude jumped past triple digits in early trading as roughly a fifth of global seaborne oil supply was abruptly cut off.',
    'Capitals across the region traded warnings overnight as the blockade drew emergency consultations at the UN Security Council.',
    'Port authorities say some 1,400 crew remain stranded aboard idled tankers, with coastal fuel shortages reported within hours.']},
  D02:{alert:'SANCTIONS IMPOSED', sat:'D02_sanctions.jpg', angles:[
    'A sweeping sanctions package announced this morning targets dozens of shipping registries and operators across the Gulf.',
    'Freight and insurance costs spiked as carriers scrambled to vet vessels against the newly blacklisted fleet.',
    'The measures deepened a diplomatic rift, with affected states vowing countermeasures and appeals to allied governments.',
    'Maritime unions warned that roughly 3,000 seafarers could face contract suspensions as listed vessels are pulled from service.']},
  D03:{alert:'TANKER SEIZED', sat:'D03_tanker_seizure.jpg', angles:[
    'Armed vessels seized a fully laden crude tanker in the Strait of Hormuz overnight, the third such incident this quarter.',
    'Oil ticked higher and war-risk premiums widened as underwriters reassessed exposure across the chokepoint.',
    'The seizure drew swift condemnation, with naval powers signalling escorts could be expanded along the lane.',
    'The tanker’s 28 crew were detained aboard, with families and flag-state officials seeking urgent consular access.']},
  D04:{alert:'DRONE ATTACK', sat:'D04_drone_strike.jpg', angles:[
    'A drone and missile strike hit the strait’s principal oil terminal, igniting storage tanks and halting all loadings.',
    'Crude futures spiked sharply as traders priced in a prolonged outage at one of the Gulf’s largest export terminals.',
    'The attack sharply raised escalation fears, prompting emergency defence consultations among regional and Western powers.',
    'Local authorities reported at least 12 killed and 40 injured in the blasts, with rescue crews still searching the terminal.']},
  D05:{alert:'COVER FROZEN', sat:'D05_insurance_suspension.jpg', angles:[
    'Marine underwriters suspended war-risk coverage for Gulf transits this afternoon, freezing departures across the region.',
    'Shipments worldwide stalled as cargoes without valid cover were held in port, snarling global supply chains.',
    'The suspension piled pressure on governments to provide state-backed guarantees to keep the lane open.',
    'Dock workers at several ports were sent home as loadings ceased, with thousands of jobs idled indefinitely.']},
  D06:{alert:'CYBER ATTACK', sat:'D06_cyber_attack.jpg', angles:[
    'A coordinated cyber-attack crippled port logistics across the strait, scrambling vessel routing and stranding cargo at sea.',
    'Delays cascaded through freight markets as automated terminals fell back to manual operations, slowing throughput sharply.',
    'Officials blamed a state-linked actor, raising the prospect of retaliation and tighter controls on critical infrastructure.',
    'Crews aboard dozens of waiting vessels faced extended stays at anchor, straining provisions and relief schedules.']},
  R01:{alert:'ESCORT DEPLOYED', sat:'R01_naval_escort.jpg', angles:[
    'A multinational naval escort began freedom-of-navigation transits through the strait, reopening the contested lane to traffic.',
    'Crude eased and freight rates pulled back as the first escorted convoys cleared the chokepoint without incident.',
    'The deployment marked a show of unity among coalition partners, who pledged sustained protection for shipping.',
    'Crews aboard the first convoy were cleared to transit, easing fears for thousands of seafarers waiting at anchor.']},
  R02:{alert:'RE‑FLAGGED', sat:'R02_reflagging.jpg', angles:[
    'Dozens of vessels were re-flagged under emergency provisions, returning a seized tanker to service under a new registry.',
    'The move steadied charter markets as operators regained access to coverage and cargo commitments resumed.',
    'The re-flagging offered a diplomatic off-ramp, lowering the temperature around the disputed vessels.',
    'Detained crew were released and repatriated, with seafarer welfare groups confirming their safe return ashore.']},
  R03:{alert:'ROUTE OPENED', sat:'R03_alt_route.jpg', angles:[
    'An alternative cape route was activated this morning, diverting Gulf-bound traffic away from the contested strait.',
    'Longer voyages lifted freight costs modestly, but reliable delivery windows calmed jittery commodity desks.',
    'The rerouting reduced direct confrontation at the chokepoint, buying space for negotiations to proceed.',
    'Crews welcomed the safer passage despite added days at sea, with relief rotations adjusted accordingly.']},
  R04:{alert:'TALKS OPENED', sat:'R04_backchannel.jpg', angles:[
    'Diplomatic back-channels opened overnight, pausing the escalation of sanctions as negotiators sought a ceasefire.',
    'Markets steadied on the talks, with crude giving back recent gains and risk premiums narrowing.',
    'Mediators reported cautious progress, framing the dialogue as the first substantive contact in weeks.',
    'Aid corridors were provisionally agreed, allowing relief supplies to reach communities affected by the standoff.']},
  R05:{alert:'RESERVES RELEASED', sat:'R05_spr_release.jpg', angles:[
    'Governments ordered a coordinated release from strategic petroleum reserves to offset the strait disruption.',
    'Crude prices fell as the additional barrels reassured markets and decoupled pricing from the crisis.',
    'The joint action signalled allied resolve, coordinating energy security across consumer nations.',
    'Officials said the release would shield households from fuel price spikes through the coming weeks.']},
  R06:{alert:'COALITION FORMED', sat:'R06_coalition.jpg', angles:[
    'A broad maritime coalition formed today, pledging sustained protection for Gulf shipping lanes.',
    'Shipping equities and freight markets steadied on expectations of durable security along the route.',
    'The alliance marked a significant diplomatic shift, broadening the response beyond a single power.',
    'Seafarer organisations welcomed the commitment, citing improved safety guarantees for tens of thousands of crew.']},
};

const BROADCAST_IDLE_ITEMS = [
  'Strait of Hormuz remains open as routine tanker traffic transits the Gulf under clear skies.',
  'Maritime monitors report normal shipping volumes through the strait over the past 24 hours.',
  'Energy desks note steady crude flows with no disruption logged at regional terminals.',
  'Coalition patrols continue routine freedom-of-navigation transits along the shipping lane.',
];
