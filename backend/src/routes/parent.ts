import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { randomUUID } from 'crypto';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;
    const id = randomUUID();

    const { data, error } = await supabase
      .from('parents')
      .insert({ id, email: email || `parent_${Date.now()}@temp.com` })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ parent: data });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to create parent' });
  }
});

router.post('/children', async (req, res) => {
  try {
    const { parent_id, display_name, age, persona } = req.body;

    let validParentId = parent_id;
    
    if (!parent_id || parent_id === 'temp-parent-id') {
    
      const { data: newParent, error: parentError } = await supabase
        .from('parents')
        .insert({ 
          id: randomUUID(),
          email: `parent_${Date.now()}@temp.com` 
        })
        .select()
        .single();
      
      if (parentError) {
        console.error('Parent creation error:', parentError);
        return res.status(400).json({ error: 'Failed to create parent: ' + parentError.message });
      }
      
      validParentId = newParent.id;
    } else {
      
      const { data: existingParent } = await supabase
        .from('parents')
        .select('id')
        .eq('id', parent_id)
        .single();
      
      if (!existingParent) {
        
        const { data: newParent, error: parentError } = await supabase
          .from('parents')
          .insert({ 
            id: parent_id,
            email: `parent_${Date.now()}@temp.com` 
          })
          .select()
          .single();
        
        if (parentError) {
          console.error('Parent creation error:', parentError);
          return res.status(400).json({ error: 'Failed to create parent: ' + parentError.message });
        }
        
        validParentId = newParent.id;
      }
    }

    const { data, error } = await supabase
      .from('children')
      .insert({
        parent_id: validParentId,
        display_name,
        age,
        persona_name: persona.name,
        persona_role: persona.role,
        persona_tone: persona.tone,
        persona_rules: persona.rules,
        persona_expertise: persona.expertise,
        persona_welcome: persona.welcomeMessage,
        persona_voice_id: persona.voiceId,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ child: data, parent_id: validParentId });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to create child' });
  }
});

router.get('/children/:parent_id', async (req, res) => {
  try {
    const { parent_id } = req.params;

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parent_id);

    if (error) throw error;

    res.json({ children: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

router.get('/conversations/:child_id', async (req, res) => {
  try {
    const { child_id } = req.params;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('child_id', child_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ conversations: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
