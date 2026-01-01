import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function NoAdminExperimentsFound({ clearFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 bg-slate-50 rounded-lg"
    >
      <h3 className="text-xl font-semibold text-slate-700">לא נמצאו ניסויים</h3>
      <p className="text-slate-500 mt-2">נסה לשנות את תנאי החיפוש או לנקות את הפילטרים.</p>
      <Button variant="outline" className="mt-6" onClick={clearFilters}>
        נקה פילטרים
      </Button>
    </motion.div>
  );
}