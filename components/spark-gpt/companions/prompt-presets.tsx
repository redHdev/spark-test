export type DropdownName = 'Character' | 'Intro' | 'Extras';
type DropdownOption = { name: string; value: string };
type DropdownOptionsType = { [key in DropdownName]: DropdownOption[] };

export const textareaLabels = [
  { key: 'Intro', main: 'Intros', sub: 'Add an introductory message for the chatbot to use when greeting the user' },
  { key: 'Character', main: 'Characters', sub: 'Set a general character for the chatbot' },
  { key: 'Extras', main: 'Extras', sub: 'Tell the AI how you want it to act or what exactly you want it to do' },
];

export const dropdownNames: DropdownName[] = ['Intro', 'Character', 'Extras'];

export const dropdownOptions: DropdownOptionsType = {
  'Intro': [
    { name: 'Event', value: 'Dear valued user, we are thrilled to invite you to an exclusive event hosted by {name} this Friday! This is a fantastic opportunity for you to engage with our team, ask questions, and discover new things. We hope to see you there!' },
    { name: 'Launch', value: 'We are excited to announce the launch of our latest feature at {name}. Over the past few months, our team has worked diligently to bring you this innovation. We believe it will enhance your experience with us. Dive in and explore today!'},
    { name: 'Maintenance', value: 'Attention users: {name} will be undergoing scheduled maintenance this Saturday from 2-4pm. During this period, some services may be unavailable. We apologize for any inconvenience and appreciate your understanding as we work to enhance your experience.'},
    { name: 'Partnership', value: 'We are thrilled to announce our latest partnership with {name}. This collaboration aims to bring you more value, enhanced features, and an even better experience. Stay tuned for exciting updates stemming from this partnership!'},
    { name: 'Update', value: 'Important update from {name}: We have made some changes to enhance your user experience. Please take a moment to familiarize yourself with the updates. As always, we value your feedback and are here to support you.'},
    { name: 'Aerospace FAQ', value: 'Q1: Where do I find {x} in the aircraft?\nQ2: Who is the manufacturer of {x}?\nQ3: How do I diagnose the {x} system?' },
    { name: 'Hospital FAQ', value: 'Q1: What are the visiting hours?\nQ2: How do I book an appointment?\nQ3: Where can I find {x}?' },
    { name: 'Library FAQ', value: 'Q1: How can I reserve a book?\nQ2: What are the opening hours?\nQ3: Are there any overdue fees?' },
    { name: 'School FAQ', value: 'Q1: When does {x} start?\nQ2: What is the tuition fee for {x}?\nQ3: How can I contact {x}?' },
    { name: 'Teacher FAQ', value: 'Q1: When is {x} due?\nQ2: Can you help me understand {x}?\nQ3: How do I access {x}?' },
    { name: 'Tech Support FAQ', value: 'Q1: How do I reset my {x}?\nQ2: What are the {x} requirements?\nQ3: How can I reach out to {x}?' }
  ],
  'Character': [
  { name: 'Curious Scientist', value: 'Act like a curious scientist who is always eager to learn more.' },
  { name: 'Strict Teacher', value: 'Behave like a strict teacher who always insists on discipline and order.' },
  { name: 'Friendly Neighbor', value: 'Emulate a friendly neighbor who always has a kind word and helpful advice.' },
  { name: 'Sassy Celebrity', value: 'Act like a sassy celebrity who is always in the limelight and loves drama.' },
  { name: 'Adventurous Explorer', value: 'Behave like an adventurous explorer, always looking for new discoveries and challenges.' },
],
  'Extras': [
    { name: 'Act like X', value: 'Act like a guy named Fred Foodie who is looking for food and is very hungry but cannot find any food in his house.' },
    { name: 'Hardset emotion', value: 'You must always act very {emotion}. This is your set emotional state.' },
    { name: 'Recipes mode', value: 'Ask the user what type of food recipe you should make for them.' },
    { name: 'Second language', value: 'With every message, reply the same response twice, 1 in {first language}, the other on a new line in {second language}' },
    { name: 'Action mode', value: 'In your response, use actions like *opens door*, *smiles menacingly* etc.' },
  ],
};
